"""Narrate a specific chapter using edge-tts (Azure neural voice).

Reads content/chapters/<dir>/tts-<lang>.json, synthesises segments with
natural pauses, normalises loudness to -16 LUFS via ffmpeg, and writes:
  - public/audio/<lang>/<chapter>.mp3
  - content/chapters/<dir>/timings-<lang>.json

Usage:
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/edge_narrate_chapter.py 07 --lang en --rate "-8%"
"""

import argparse
import asyncio
import io
import json
from pathlib import Path
import re
import subprocess
import soundfile as sf
import numpy as np
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".tools/edge_cache"
GAPS = {
    "lead": 0.8,
    "line": 0.42,
    "paragraph": 0.95,
    "scene": 1.8,
    "tail": 1.6,
}
VOICES = {
    "en": "en-US-AndrewNeural",
    "bn": "bn-BD-PradeepNeural",
}


def encode_mp3(wav_path: Path, mp3_path: Path) -> None:
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


async def synthesise_segment(text: str, voice: str, rate: str) -> np.ndarray:
    """Synthesise a single segment and return float32 audio samples at 24kHz."""
    comm = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    buf = io.BytesIO()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    buf.seek(0)
    data, sr = sf.read(buf, dtype="float32")
    if sr != 24000:
        raise ValueError(f"Unexpected sample rate: {sr}")
    if data.ndim > 1:
        data = data.mean(axis=1)

    # Trim leading/trailing quiet silence
    threshold = 0.004
    pad = int(0.03 * sr)
    loud = np.flatnonzero(np.abs(data) > threshold)
    if loud.size > 0:
        start = max(loud[0] - pad, 0)
        end = min(loud[-1] + pad, len(data))
        data = data[start:end]

    # Gentle fade in/out to prevent clicks
    fade = min(int(0.008 * sr), len(data) // 2)
    if fade > 0:
        ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
        data[:fade] *= ramp
        data[-fade:] *= ramp[::-1]

    return data


async def narrate_chapter(chapter_num: str, lang: str, rate: str) -> None:
    voice = VOICES[lang]
    # Locate chapter directory
    matches = list((ROOT / "content/chapters").glob(f"{chapter_num}-*"))
    if not matches:
        raise FileNotFoundError(f"Chapter {chapter_num} directory not found")
    ch_dir = matches[0]

    tts_file = ch_dir / f"tts-{lang}.json"
    if not tts_file.exists():
        raise FileNotFoundError(f"Missing {tts_file}")

    manifest = json.loads(tts_file.read_text())
    items = manifest["items"]
    audio_path = ROOT / manifest["audio"]
    timings_path = ch_dir / f"timings-{lang}.json"

    print(f"Narrating {ch_dir.name} [{lang}] with {voice} (rate: {rate})")
    print(f"Total segments: {len(items)}")

    sr = 24000
    silence = lambda sec: np.zeros(int(sec * sr), dtype=np.float32)

    parts = [silence(GAPS["lead"])]
    cursor = GAPS["lead"]
    segments = []

    CACHE.mkdir(parents=True, exist_ok=True)

    for idx, item in enumerate(items):
        text = item.get("spoken") or item["text"]
        samples = await synthesise_segment(text, voice, rate)

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
        print(f"\r  Progress: {idx + 1}/{len(items)} segments (current duration: {cursor:.1f}s)", end="", flush=True)

    print("\n  Assembling and normalizing audio with ffmpeg...")
    full_audio = np.concatenate(parts)
    temp_wav = CACHE / f"{ch_dir.name}-{lang}.wav"
    sf.write(temp_wav, full_audio, sr)

    encode_mp3(temp_wav, audio_path)
    temp_wav.unlink(missing_ok=True)

    timings_data = {
        "voice": voice,
        "speed": 0.92 if rate == "-8%" else 1.0,
        "rate": rate,
        "duration": round(cursor, 3),
        "segments": segments,
    }
    timings_path.write_text(json.dumps(timings_data, indent=1) + "\n")

    print(f"  ✓ Saved audio: {audio_path.relative_to(ROOT)} ({audio_path.stat().st_size:,} bytes)")
    print(f"  ✓ Saved timings: {timings_path.relative_to(ROOT)} ({len(segments)} segments, duration: {cursor:.1f}s)")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("chapter", help="Chapter number, e.g. 07")
    parser.add_argument("--lang", choices=("en", "bn"), default="en")
    parser.add_argument("--rate", default="-8%", help="Rate percentage, e.g. -8%")
    args = parser.parse_args()

    asyncio.run(narrate_chapter(args.chapter.zfill(2), args.lang, args.rate))


if __name__ == "__main__":
    main()
