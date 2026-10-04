"""Narrate Bengali chapters with the local MLX IndicF5 voice clone.

Reads content/chapters/*/tts-bn.json (written by scripts/build-content.ts), synthesises each
subtitle line by cloning the reference voice, assembles the chapter with the same pauses as
tools/narrate.py, normalises loudness to -16 LUFS and writes the MP3 plus timings-bn.json.
Per-line audio is cached under .tools/indicf5_cache so a stopped run resumes.

Python environment: .tools/indicf5-venv

Usage: indicf5_narrate.py [--ref REF] [--ref-text-file TXT] [--steps 8] [--limit N] [--force] [chapter ids]
"""

import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import time

import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / ".tools/indicf5_cache"
REF_WAV = ROOT / ".tools/indicf5_ref"


def patch_mlx_random() -> None:
    import mlx.core as mx

    original = mx.random.normal

    def normal(*args, **kwargs):
        if "shape" in kwargs:
            kwargs["shape"] = tuple(int(s) for s in kwargs["shape"])
        elif args:
            args = (tuple(int(s) for s in args[0]),) + args[1:]
        return original(*args, **kwargs)

    mx.random.normal = normal


def patch_no_split() -> None:
    import f5_tts_mlx.generate as generate_module

    generate_module.split_sentences = lambda text: [text.strip()]


def to_wav(src: pathlib.Path) -> pathlib.Path:
    dst = REF_WAV / (src.stem + ".wav")
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
         "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(dst)],
        check=True,
    )
    return dst


def build_respell():
    config = json.loads((ROOT / "content/respell-bn.json").read_text("utf-8"))
    letter_map = config.get("letter_map", {})
    phrases = config.get("phrases", [])
    inventory = json.loads((ROOT / "content/pronunciation-bn.json").read_text("utf-8"))
    stems = set(config.get("extra_stems", []))
    for entry in inventory.values():
        stems.update(entry.get("bn", []))
    stems = sorted(stems, key=len, reverse=True)
    patterns = [(stem, re.compile(rf"(?<![\u0980-\u09FF]){re.escape(stem)}")) for stem in stems]

    def transform(text: str) -> str:
        for src, dst in letter_map.items():
            text = text.replace(src, dst)
        return text

    def respell(text: str) -> str:
        for phrase in phrases:
            if phrase in text:
                text = text.replace(phrase, transform(phrase))
        for _, pattern in patterns:
            text = pattern.sub(lambda m: transform(m.group(0)), text)
        return text

    return respell


def lowpass(audio: np.ndarray, sample_rate: int = 24000, cutoff: int = 0, roll: int = 700) -> np.ndarray:
    if not cutoff or cutoff >= sample_rate / 2:
        return audio
    spectrum = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(len(audio), 1 / sample_rate)
    weight = np.ones_like(freqs)
    weight[freqs >= cutoff] = 0.0
    band = (freqs > cutoff - roll) & (freqs < cutoff)
    weight[band] = 0.5 * (1 + np.cos(np.pi * (freqs[band] - (cutoff - roll)) / roll))
    return np.fft.irfft(spectrum * weight, len(audio)).astype(np.float32)


def settings_key(ref: pathlib.Path, ref_text: str, steps: int, cfg: float, gaps: dict, lowpass_cut: int) -> str:
    payload = json.dumps({
        "engine": "indicf5-mlx", "ref": ref.name, "ref_sha": hashlib.sha256(ref.read_bytes()).hexdigest()[:16],
        "ref_text": ref_text, "steps": steps, "cfg": cfg, "gaps": gaps,
        "respell": True, "lowpass": lowpass_cut,
    }, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def item_cache_path(item_hash: str, key: str) -> pathlib.Path:
    return CACHE / f"{key[:8]}-{item_hash}.wav"


def synthesise(model, ref_wav, ref_text, spoken, steps, cfg, cache_path: pathlib.Path, force: bool,
               respell, lowpass_cut: int) -> np.ndarray:
    if cache_path.exists() and not force:
        data, _ = sf.read(cache_path, dtype="float32")
        return data
    from indic_f5_mlx import generate

    text = respell(spoken)
    audio = np.asarray(
        generate(model, ref_audio_path=str(ref_wav), ref_text=ref_text, text=text,
                 steps=steps, cfg_strength=cfg),
        dtype=np.float32,
    )
    audio = lowpass(audio, cutoff=lowpass_cut)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(cache_path, audio, 24000)
    return audio


def encode(wav: pathlib.Path, mp3: pathlib.Path) -> None:
    target = "loudnorm=I=-16:TP=-1.5:LRA=11"
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(wav), "-af", f"{target}:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    )
    match = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", probe.stderr)
    if not match:
        raise RuntimeError("ffmpeg loudness probe failed")
    measured = json.loads(match.group(0))
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


def narrate_chapter(model, directory, config, ref_wav, ref_text, steps, cfg, key, force, limit, respell, lowpass_cut):
    manifest = json.loads((directory / "tts-bn.json").read_text("utf-8"))
    items = manifest["items"][:limit] if limit else manifest["items"]
    audio_out = ROOT / manifest["audio"]
    timings_file = directory / "timings-bn.json"
    if not force and audio_out.exists() and timings_file.exists():
        previous = json.loads(timings_file.read_text("utf-8"))
        if previous.get("settings_key") == key and [s["hash"] for s in previous["segments"]] == [i["hash"] for i in items]:
            print(f"{directory.name}: up to date")
            return

    rate = 24000
    gaps = config["gaps"]
    silence = lambda seconds: np.zeros(int(seconds * rate), dtype=np.float32)
    parts = [silence(gaps["lead"])]
    cursor = gaps["lead"]
    segments = []
    started = time.time()
    for index, item in enumerate(items):
        samples = synthesise(model, ref_wav, ref_text, item["spoken"], steps, cfg,
                             item_cache_path(item["hash"], key), force, respell, lowpass_cut)
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
        elapsed = time.time() - started
        rate_s = elapsed / (index + 1)
        print(f"\r{directory.name}: {index + 1}/{len(items)}  {rate_s:.1f}s/line  eta {(len(items) - index - 1) * rate_s / 60:.1f}m",
              end="", flush=True)

    wav = CACHE / f"{directory.name}-bn.wav"
    CACHE.mkdir(parents=True, exist_ok=True)
    sf.write(wav, np.concatenate(parts), rate)
    encode(wav, audio_out)
    wav.unlink()
    timings_file.write_text(json.dumps(
        {"voice": "indicf5-mlx", "ref": ref_wav.name, "ref_text": ref_text, "steps": steps, "cfg": cfg,
         "settings_key": key, "duration": round(cursor, 3), "segments": segments},
        ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"\r{directory.name}: {cursor / 60:.1f} min -> {audio_out.relative_to(ROOT)} ({time.time() - started:.0f}s)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("chapters", nargs="*", help="chapter ids, e.g. 07 (default: all)")
    parser.add_argument("--ref", type=pathlib.Path, default=ROOT / "auditions/gemini-bn-storyteller.mp3")
    parser.add_argument("--ref-text-file", type=pathlib.Path, default=REF_WAV / "ref-bn-storyteller.txt")
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--cfg", type=float, default=2.0)
    parser.add_argument("--lowpass", type=int, default=8000, help="low-pass cutoff Hz to remove vocoder hiss (0 disables)")
    parser.add_argument("--limit", type=int, default=0, help="only first N lines per chapter (for tests)")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    config = json.loads((ROOT / "content/narration.json").read_text("utf-8"))["bn"]
    ref_text = args.ref_text_file.read_text("utf-8").strip()
    ref_wav = to_wav(args.ref) if args.ref.suffix.lower() != ".wav" else args.ref
    key = settings_key(ref_wav, ref_text, args.steps, args.cfg, config["gaps"], args.lowpass)
    respell = build_respell()

    patch_mlx_random()
    patch_no_split()

    from indic_f5_mlx import load_indicf5

    print("Loading IndicF5 ...", flush=True)
    model, _ = load_indicf5()

    found = False
    for directory in sorted((ROOT / "content/chapters").iterdir()):
        if not (directory / "tts-bn.json").exists():
            continue
        if args.chapters and directory.name[:2] not in args.chapters:
            continue
        found = True
        narrate_chapter(model, directory, config, ref_wav, ref_text, args.steps, args.cfg, key, args.force, args.limit, respell, args.lowpass)
    if not found:
        raise SystemExit("no chapters to narrate")


if __name__ == "__main__":
    main()
