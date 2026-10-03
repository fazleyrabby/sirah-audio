"""Narrate all 37 chapters in English and Bengali using edge-tts (Azure neural voices).

Voices:
  - en: en-US-AndrewNeural (rate: -8%)
  - bn: bn-BD-PradeepNeural (rate: -8%)

Features:
  - Concurrent segment fetching (Semaphore: 5) for fast throughput (~20-25s per chapter).
  - Accurate segment timing directly from synthesized audio.
  - Natural pauses (lead, line, paragraph, scene, tail).
  - Loudness normalization to -16 LUFS via ffmpeg.
  - Resumable: skips chapters whose audio and timings are already up to date.

Usage:
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/edge_narrate_all.py --lang en
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/edge_narrate_all.py --lang bn
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/edge_narrate_all.py --all
"""

import argparse
import asyncio
import io
import json
from pathlib import Path
import re
import subprocess
import time
import edge_tts
import numpy as np
import soundfile as sf

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
HONORIFIC = {
    "en": ", peace be upon him,",
    "bn": " সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম",
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


async def synthesise_segment_with_retry(text: str, voice: str, rate: str, sem: asyncio.Semaphore, retries: int = 3) -> np.ndarray:
    async with sem:
        for attempt in range(retries):
            try:
                comm = edge_tts.Communicate(text=text, voice=voice, rate=rate)
                buf = io.BytesIO()
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        buf.write(chunk["data"])
                buf.seek(0)
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

                return data
            except Exception as e:
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(1.0 + attempt * 1.5)


async def narrate_chapter(ch_dir: Path, lang: str, rate: str, sem: asyncio.Semaphore, force: bool = False) -> bool:
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

    # Prepare texts for each segment
    texts = []
    for item in items:
        if lang == "bn":
            # For Bengali, expand ﷺ if present
            t = item["text"].replace(" ﷺ", HONORIFIC["bn"]).replace("ﷺ", HONORIFIC["bn"])
        else:
            t = item.get("spoken") or item["text"]
        texts.append(t)

    # Synthesise all segments concurrently
    tasks = [synthesise_segment_with_retry(text, voice, rate, sem) for text in texts]
    samples_list = await asyncio.gather(*tasks)

    sr = 24000
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
        "speed": 0.92,
        "rate": rate,
        "duration": round(cursor, 3),
        "segments": segments,
    }
    timings_path.write_text(json.dumps(timings_data, indent=1) + "\n")
    elapsed = time.time() - t0
    print(f"  ✓ {ch_dir.name} [{lang}]: {cursor:.1f}s audio in {elapsed:.1f}s -> {audio_path.name}")
    # Immediately sync content ledger so the chapter becomes playable right away
    subprocess.run(["node", "scripts/build-content.ts"], cwd=str(ROOT), capture_output=True)
    return True



async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=("en", "bn"))
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--chapters", nargs="*", help="Optional list of chapter numbers, e.g. 01 02")
    parser.add_argument("--rate", default="-8%")
    parser.add_argument("--concurrency", type=int, default=5)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if args.all:
        langs = ["en", "bn"]
    elif args.lang:
        langs = [args.lang]
    else:
        parser.error("Specify --lang [en|bn] or --all")

    CACHE.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(args.concurrency)

    all_dirs = sorted((ROOT / "content/chapters").glob("[0-9][0-9]-*"))
    if args.chapters:
        target_ids = {c.zfill(2) for c in args.chapters}
        all_dirs = [d for d in all_dirs if d.name[:2] in target_ids]

    for lang in langs:
        print(f"\n=======================================================")
        print(f"Starting narration for {lang.upper()} ({len(all_dirs)} chapters)")
        print(f"Voice: {VOICES[lang]} | Rate: {args.rate} | Concurrency: {args.concurrency}")
        print(f"=======================================================")

        for idx, ch_dir in enumerate(all_dirs):
            print(f"[{idx + 1}/{len(all_dirs)}] Checking {ch_dir.name}...")
            await narrate_chapter(ch_dir, lang, args.rate, sem, force=args.force)

    # Rebuild content so all generated chapters become playable
    print("\nRebuilding content ledger (npm run content)...")
    subprocess.run(["node", "scripts/build-content.ts"], cwd=str(ROOT), check=True)
    print("\nAll chapters successfully built and synchronized!")


if __name__ == "__main__":
    asyncio.run(main())
