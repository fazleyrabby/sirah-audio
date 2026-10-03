"""Narrate chapters with a local neural voice (Kokoro).

Reads content/chapters/*/tts-<lang>.json (written by scripts/build-content.ts), synthesises
each line, assembles the chapter with natural pauses, normalises loudness to -16 LUFS and
writes the MP3 plus timings-<lang>.json. Timings come from the audio itself, so subtitles
are exact without forced alignment.

Usage: narrate.py [--lang en] [--force] [--voice NAME] [--sample TEXT OUT.mp3] [chapter ids...]
"""

import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODELS = ROOT / ".tools" / "models"
CACHE = ROOT / ".tools" / "cache"


def load_lexicon(config):
    path = config.get("ipa_lexicon")
    if not path:
        return {}
    lexicon = json.loads((ROOT / path).read_text())
    if not isinstance(lexicon, dict) or not all(
        isinstance(word, str) and word and isinstance(ipa, str) and ipa
        for word, ipa in lexicon.items()
    ):
        raise ValueError(f"invalid IPA lexicon: {path}")
    return lexicon


def phonemize_with_lexicon(tokenizer, text, lang, lexicon):
    """Phonemize ordinary text, replacing whole Arabic terms with IPA entries."""
    if not lexicon:
        return tokenizer.phonemize(text, lang)
    alternatives = "|".join(re.escape(word) for word in sorted(lexicon, key=len, reverse=True))
    pattern = re.compile(rf"(?<![\w])(?P<word>{alternatives})(?P<possessive>['’]s)?(?![\w])", re.IGNORECASE)
    lookup = {word.casefold(): ipa for word, ipa in lexicon.items()}
    parts = []
    cursor = 0
    for match in pattern.finditer(text):
        if match.start() > cursor:
            parts.append(tokenizer.phonemize(text[cursor:match.start()], lang))
        ipa = lookup[match.group("word").casefold()]
        parts.append(ipa + ("z" if match.group("possessive") else ""))
        cursor = match.end()
    if cursor < len(text):
        parts.append(tokenizer.phonemize(text[cursor:], lang))
    return " ".join(part for part in parts if part)


def narration_key(config, lexicon):
    settings = {key: config[key] for key in ("engine", "voice", "speed", "lang", "gaps")}
    settings["ipa_lexicon"] = lexicon
    return hashlib.sha1(json.dumps(settings, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def voice_style(kokoro, spec):
    """A voice name, or a blend such as "am_michael:0.6,bm_george:0.4"."""
    if ":" not in spec:
        return spec
    parts = [part.split(":") for part in spec.split(",")]
    total = sum(float(weight) for _, weight in parts)
    return sum(kokoro.get_voice_style(name) * (float(weight) / total) for name, weight in parts)


def trim(samples, rate, pad=0.03, threshold=0.004):
    loud = np.flatnonzero(np.abs(samples) > threshold)
    if loud.size == 0:
        return samples
    start = max(loud[0] - int(pad * rate), 0)
    end = min(loud[-1] + int(pad * rate), len(samples))
    return samples[start:end]


def synthesise(kokoro, text, config, voice, lexicon, settings_key):
    key = hashlib.sha1(f"{settings_key}|{text}".encode()).hexdigest()
    cached = CACHE / f"{key}.npy"
    if cached.exists():
        return np.load(cached)
    if lexicon:
        phonemes = phonemize_with_lexicon(kokoro.tokenizer, text, config["lang"], lexicon)
        samples, rate = kokoro.create(phonemes, voice=voice, speed=config["speed"],
                                      lang=config["lang"], is_phonemes=True)
    else:
        samples, rate = kokoro.create(text, voice=voice, speed=config["speed"], lang=config["lang"])
    samples = trim(np.asarray(samples, dtype=np.float32), rate)
    # Short fades so joins never click.
    fade = min(int(0.008 * rate), len(samples) // 2)
    if fade:
        ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
        samples[:fade] *= ramp
        samples[-fade:] *= ramp[::-1]
    CACHE.mkdir(parents=True, exist_ok=True)
    np.save(cached, samples)
    return samples


def encode(wav, mp3):
    """Two-pass loudness normalisation to -16 LUFS, then MP3."""
    target = "loudnorm=I=-16:TP=-1.5:LRA=11"
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(wav), "-af", f"{target}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    measured = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", probe.stderr).group(0))
    chain = (
        f"{target}:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
        f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
        f":offset={measured['target_offset']}:linear=true"
    )
    mp3.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-af", chain,
         "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", str(mp3)],
        check=True,
    )


def narrate_chapter(kokoro, directory, language, config, force):
    lexicon = load_lexicon(config)
    settings_key = narration_key(config, lexicon)
    manifest = json.loads((directory / f"tts-{language}.json").read_text())
    items = manifest["items"]
    audio = ROOT / manifest["audio"]
    timings_file = directory / f"timings-{language}.json"
    if not force and audio.exists() and timings_file.exists():
        previous = json.loads(timings_file.read_text())
        if previous.get("settings_key") == settings_key and [s["hash"] for s in previous["segments"]] == [i["hash"] for i in items]:
            print(f"{directory.name} [{language}]: up to date")
            return

    voice = voice_style(kokoro, config["voice"])
    rate = 24000
    gaps = config["gaps"]
    silence = lambda seconds: np.zeros(int(seconds * rate), dtype=np.float32)
    parts = [silence(gaps["lead"])]
    cursor = gaps["lead"]
    segments = []
    for index, item in enumerate(items):
        samples = synthesise(kokoro, item["spoken"], config, voice, lexicon, settings_key)
        start = cursor
        cursor += len(samples) / rate
        segments.append({"id": item["id"], "hash": item["hash"], "start": round(start, 3), "end": round(cursor, 3)})
        parts.append(samples)
        following = items[index + 1] if index + 1 < len(items) else None
        if following is None:
            gap = gaps["tail"]
        elif following["sceneId"] != item["sceneId"]:
            gap = gaps["scene"]
        elif following["para"] != item["para"]:
            gap = gaps["paragraph"]
        else:
            gap = gaps["line"]
        parts.append(silence(gap))
        cursor += gap
        print(f"\r{directory.name} [{language}]: {index + 1}/{len(items)}", end="", flush=True)

    wav = CACHE / f"{directory.name}-{language}.wav"
    sf.write(wav, np.concatenate(parts), rate)
    encode(wav, audio)
    wav.unlink()
    timings_file.write_text(json.dumps(
        {"voice": config["voice"], "speed": config["speed"], "settings_key": settings_key,
         "duration": round(cursor, 3), "segments": segments},
        indent=1) + "\n")
    print(f"\r{directory.name} [{language}]: {cursor / 60:.1f} min -> {audio.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("chapters", nargs="*", help="chapter ids, e.g. 07 (default: all)")
    parser.add_argument("--lang", default="en")
    parser.add_argument("--voice")
    parser.add_argument("--speed", type=float)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--sample", nargs=2, metavar=("TEXT", "OUT"))
    args = parser.parse_args()

    config = json.loads((ROOT / "content" / "narration.json").read_text())[args.lang]
    if args.voice:
        config["voice"] = args.voice
    if args.speed:
        config["speed"] = args.speed
    lexicon = load_lexicon(config)
    settings_key = narration_key(config, lexicon)
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))

    if args.sample:
        text, out = args.sample
        samples = synthesise(kokoro, text, config, voice_style(kokoro, config["voice"]), lexicon, settings_key)
        CACHE.mkdir(parents=True, exist_ok=True)
        wav = CACHE / "sample.wav"
        sf.write(wav, samples, 24000)
        encode(wav, pathlib.Path(out).resolve())
        wav.unlink()
        return

    found = False
    for directory in sorted((ROOT / "content" / "chapters").iterdir()):
        if not (directory / f"tts-{args.lang}.json").exists():
            continue
        if args.chapters and directory.name[:2] not in args.chapters:
            continue
        found = True
        narrate_chapter(kokoro, directory, args.lang, config, args.force)
    if not found:
        sys.exit("no chapters to narrate")


if __name__ == "__main__":
    main()
