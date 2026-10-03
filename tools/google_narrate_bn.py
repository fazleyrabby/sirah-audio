import argparse
import asyncio
import io
import json
import logging
import os
import pathlib
import re
import subprocess
import time
import sys

import numpy as np
import soundfile as sf

from google.cloud import texttospeech
from google.api_core.exceptions import ResourceExhausted

ROOT = pathlib.Path(__file__).parent.parent
CACHE = ROOT / ".tools/google_cache"

GAPS = {
    "lead": 0.5,
    "line": 0.3,
    "paragraph": 0.8,
    "scene": 1.2,
    "tail": 1.6,
}
VOICES = {
    "bn": "bn-IN-Wavenet-A",
}
HONORIFIC = {
    "bn": " সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম",
}


def encode_mp3(wav_path: pathlib.Path, mp3_path: pathlib.Path) -> None:
    """Two-pass loudness normalisation to -16 LUFS, then MP3."""
    target = "loudnorm=I=-16:TP=-1.5:LRA=11"
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(wav_path), "-af", f"{target}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
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
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path),
            "-af", chain, "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k", str(mp3_path)
        ],
        check=True,
    )

def synthesise_segment(client, text: str, voice_name: str, segment_hash: str) -> np.ndarray:
    cache_file = CACHE / f"{segment_hash}_{voice_name}.wav"
    if cache_file.exists():
        data, sr = sf.read(cache_file, dtype="float32")
        return data, sr

    print(f"    Fetching {segment_hash} from Google TTS...")
    synthesis_input = texttospeech.SynthesisInput(text=text)
    
    # Parse language code from voice name (e.g., bn-IN-Wavenet-A -> bn-IN)
    lang_code = "-".join(voice_name.split("-")[:2])
    
    voice = texttospeech.VoiceSelectionParams(
        language_code=lang_code,
        name=voice_name
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.LINEAR16,
        sample_rate_hertz=24000
    )
    
    try:
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
    except ResourceExhausted as e:
        print(f"\n[!] Daily Quota Exceeded for Google Cloud TTS.")
        print(f"Details: {e}")
        print(f"Please wait and run again tomorrow to continue from where you left off.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[!] Error generating audio: {e}")
        raise e

    buf = io.BytesIO(response.audio_content)
    data, sr = sf.read(buf, dtype="float32")
    
    if data.ndim > 1:
        data = data.mean(axis=1)

    # Trim silence
    threshold = 0.004
    pad = int(0.03 * sr)
    loud = np.flatnonzero(np.abs(data) > threshold)
    if loud.size > 0:
        start = max(loud[0] - pad, 0)
        end = min(loud[-1] + pad, len(data))
        data = data[start:end]

    # De-click fades
    fade = min(int(0.008 * sr), len(data) // 2)
    if fade > 0:
        ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
        data[:fade] *= ramp
        data[-fade:] *= ramp[::-1]

    # Save to cache
    sf.write(cache_file, data, sr)
    
    return data, sr


def narrate_chapter(client, ch_dir: pathlib.Path, lang: str, force: bool = False) -> bool:
    voice = VOICES[lang]
    tts_file = ch_dir / f"tts-{lang}.json"
    if not tts_file.exists():
        return False

    manifest = json.loads(tts_file.read_text())
    items = manifest["items"]
    audio_path = ROOT / manifest["audio"]
    timings_path = ch_dir / f"timings-{lang}.json"

    # Check if already generated and up to date
    if not force and audio_path.exists() and timings_path.exists():
        try:
            prev = json.loads(timings_path.read_text())
            prev_hashes = [s.get("hash") for s in prev.get("segments", [])]
            curr_hashes = [i.get("hash") for i in items]
            if prev_hashes == curr_hashes and prev.get("voice") == voice:
                print(f"  [✓ Cached] {ch_dir.name} [{lang}]: {len(items)} segments already up to date")
                return True
        except Exception:
            pass

    t0 = time.time()
    print(f"\nNarrating {ch_dir.name} [{lang}] ({len(items)} segments)...")

    samples_list = []
    sr = 24000
    
    for idx, item in enumerate(items):
        if lang == "bn":
            t = item["text"].replace(" ﷺ", HONORIFIC["bn"]).replace("ﷺ", HONORIFIC["bn"])
        else:
            t = item.get("spoken") or item["text"]
            
        data, sample_rate = synthesise_segment(client, t, voice, item["hash"])
        sr = sample_rate
        samples_list.append(data)
        
        # Add small delay to avoid hitting rate limits (e.g. 300 per min)
        time.sleep(0.2)

    silence = lambda sec: np.zeros(int(sec * sr), dtype=np.float32)

    parts = [silence(GAPS["lead"])]
    cursor = GAPS["lead"]
    segments = []

    for idx, item in enumerate(items):
        samples = samples_list[idx]
        start = cursor
        cursor += len(samples) / sr
        segments.append({
            "id": item["id"],
            "hash": item["hash"],
            "start": round(start, 3),
            "end": round(cursor, 3),
        })
        parts.append(samples)

        following = items[idx + 1] if idx + 1 < len(items) else None
        if following is None:
            gap = GAPS["tail"]
        elif following["sceneId"] != item["sceneId"]:
            gap = GAPS["scene"]
        elif following["para"] != item["para"]:
            gap = GAPS["paragraph"]
        else:
            gap = GAPS["line"]

        parts.append(silence(gap))
        cursor += gap

    full_audio = np.concatenate(parts)
    temp_wav = CACHE / f"{ch_dir.name}-{lang}.wav"
    sf.write(temp_wav, full_audio, sr)

    encode_mp3(temp_wav, audio_path)
    temp_wav.unlink(missing_ok=True)

    timings_data = {
        "voice": voice,
        "speed": 1.0,
        "duration": round(cursor, 3),
        "segments": segments,
    }
    timings_path.write_text(json.dumps(timings_data, indent=1) + "\n")
    elapsed = time.time() - t0
    print(f"  ✓ {ch_dir.name} [{lang}]: {cursor:.1f}s audio in {elapsed:.1f}s -> {audio_path.name}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Generate BN audio via Google Cloud TTS with segment caching.")
    parser.add_argument("--chapters", nargs="*", help="Optional list of chapter numbers, e.g. 01 02")
    parser.add_argument("--voice", help="Override default voice", default="bn-IN-Wavenet-A")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    VOICES["bn"] = args.voice

    try:
        client = texttospeech.TextToSpeechClient()
    except Exception as e:
        print(f"Failed to initialize Google TTS client: {e}")
        print("Please ensure GOOGLE_APPLICATION_CREDENTIALS is set.")
        sys.exit(1)

    CACHE.mkdir(parents=True, exist_ok=True)
    lang = "bn"
    
    all_dirs = sorted((ROOT / "content/chapters").glob("[0-9][0-9]-*"))
    if args.chapters:
        target_ids = {c.zfill(2) for c in args.chapters}
        all_dirs = [d for d in all_dirs if d.name[:2] in target_ids]

    print(f"\n=======================================================")
    print(f"Starting narration for {lang.upper()} ({len(all_dirs)} chapters)")
    print(f"Voice: {VOICES[lang]}")
    print(f"=======================================================")

    for i, ch_dir in enumerate(all_dirs):
        print(f"[{i + 1}/{len(all_dirs)}] Checking {ch_dir.name}...")
        narrate_chapter(client, ch_dir, lang, force=args.force)

    # Rebuild content so all generated chapters become playable
    print("\nRebuilding content ledger (npm run content)...")
    subprocess.run(["node", "scripts/build-content.ts"], cwd=str(ROOT), check=True)
    print("\nAll chapters successfully built and synchronized!")

if __name__ == "__main__":
    main()
