"""Generate prepared Azure Speech scenes on a confirmed Free (F0) resource.

Safety guards:
- Requires --send and --free-tier-confirmed.
- Strictly enforces the 500,000 character/month F0 limit (default cap 300,000 to leave safety margin).
- Resumable: caches audio and metadata per scene; checks sha256 hash before synthesizing.
- Captures native word-boundary events from Azure Speech SDK for precise subtitle alignment.
- Never falls back to a paid tier or enables billing.

Usage:
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/azure_generate_scenes.py --lang en --send --free-tier-confirmed
"""

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREPARED = ROOT / ".tools/azure/prepared"
GENERATED = ROOT / ".tools/azure/generated"
F0_MONTHLY_LIMIT = 500_000


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=("en", "bn"), required=True, help="Language to synthesize")
    parser.add_argument("--send", action="store_true", help="Explicitly permit API requests")
    parser.add_argument("--free-tier-confirmed", action="store_true",
                        help="Confirm that this API resource is Free (F0)")
    parser.add_argument("--max-chars", type=int, default=300_000,
                        help="Safety cap on total characters sent (cannot exceed 500,000 F0 limit)")
    parser.add_argument("--max-scenes", type=int, default=0,
                        help="Optional limit on number of scenes to synthesize this run (0 = unlimited up to max-chars)")
    parser.add_argument("--key", type=str, default="", help="Azure Speech Key (or use AZURE_SPEECH_KEY env var)")
    parser.add_argument("--region", type=str, default="", help="Azure Speech Region (or use AZURE_SPEECH_REGION env var)")
    args = parser.parse_args()

    if args.max_chars > F0_MONTHLY_LIMIT:
        parser.error(f"--max-chars cannot exceed the 500,000 F0 monthly limit (requested {args.max_chars:,})")

    source = PREPARED / args.lang
    manifest_file = source / "manifest.json"
    if not manifest_file.exists():
        sys.exit(f"Error: Manifest not found at {manifest_file}. Run prepare_azure_audio.py first.")

    manifest = json.loads(manifest_file.read_text())
    destination = GENERATED / args.lang
    destination.mkdir(parents=True, exist_ok=True)

    key = args.key or os.environ.get("AZURE_SPEECH_KEY")
    region = args.region or os.environ.get("AZURE_SPEECH_REGION")

    if args.send:
        if not args.free_tier_confirmed:
            sys.exit("Error: Must confirm the resource is Free (F0) with --free-tier-confirmed before sending.")
        if not key or not region:
            sys.exit("Error: Azure Speech key and region must be provided via environment variables (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION) or flags.")

    completed = 0
    scenes_to_generate = []
    chars_to_generate = 0

    for entry in manifest["scenes"]:
        stem = Path(entry["request"]).stem
        mp3 = destination / f"{stem}.mp3"
        meta = destination / f"{stem}.json"
        is_cached = False
        if mp3.exists() and meta.exists():
            try:
                previous = json.loads(meta.read_text())
                if previous.get("request_sha256") == entry["sha256"]:
                    is_cached = True
            except Exception:
                is_cached = False

        if is_cached:
            completed += 1
        else:
            scenes_to_generate.append(entry)
            chars_to_generate += entry["characters"]

    print(f"\nStatus for {args.lang}:")
    print(f"  Total scenes in manifest: {len(manifest['scenes'])}")
    print(f"  Already cached: {completed}")
    print(f"  Remaining to generate: {len(scenes_to_generate)} ({chars_to_generate:,} characters)")

    if not args.send:
        print("\n[DRY RUN] No requests sent. Use --send and --free-tier-confirmed to execute.")
        return

    try:
        import azure.cognitiveservices.speech as speechsdk
    except ImportError:
        sys.exit("Error: azure-cognitiveservices-speech package is required.")

    speech_config = speechsdk.SpeechConfig(subscription=key, region=region)
    speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3)

    chars_sent_this_run = 0
    scenes_sent_this_run = 0

    for entry in scenes_to_generate:
        if args.max_scenes > 0 and scenes_sent_this_run >= args.max_scenes:
            print(f"Stopped: reached scene limit of {args.max_scenes} scenes.")
            break
        if chars_sent_this_run + entry["characters"] > args.max_chars:
            print(f"Stopped: adding scene would exceed max-chars limit ({chars_sent_this_run + entry['characters']:,} > {args.max_chars:,}).")
            break

        stem = Path(entry["request"]).stem
        req_data = json.loads((source / entry["request"]).read_text())
        ssml = req_data["ssml"]
        mp3 = destination / f"{stem}.mp3"
        meta = destination / f"{stem}.json"

        word_boundaries = []
        def on_wb(evt):
            word_boundaries.append({
                "audio_offset_ms": evt.audio_offset / 10000,
                "duration_ms": evt.duration.total_seconds() * 1000 if hasattr(evt.duration, "total_seconds") else evt.duration / 10000,
                "text": evt.text,
                "text_offset": evt.text_offset,
                "word_length": evt.word_length,
            })

        audio_config = speechsdk.audio.AudioOutputConfig(filename=str(mp3))
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
        synthesizer.word_boundary.connect(on_wb)

        print(f"[{completed + 1}/{len(manifest['scenes'])}] Synthesizing {stem} ({entry['characters']:,} chars)...")
        result = synthesizer.speak_ssml_async(ssml).get()

        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            cancellation = result.cancellation_details
            sys.exit(f"Synthesis failed at {stem}: {cancellation.reason} - {cancellation.error_details}")

        meta_data = {
            "chapter": entry["chapter"],
            "sceneId": entry["sceneId"],
            "request_sha256": entry["sha256"],
            "voice": req_data["voice"],
            "rate": req_data["rate"],
            "pitch": req_data["pitch"],
            "characters": entry["characters"],
            "word_boundaries": word_boundaries,
            "subtitles": req_data["subtitles"],
        }
        meta.write_text(json.dumps(meta_data, ensure_ascii=False, indent=2) + "\n")

        completed += 1
        scenes_sent_this_run += 1
        chars_sent_this_run += entry["characters"]
        print(f"  ✓ Saved {mp3.name} ({mp3.stat().st_size:,} bytes). Total run chars: {chars_sent_this_run:,}")

    print(f"\nRun complete for {args.lang}:")
    print(f"  Scenes synthesized this run: {scenes_sent_this_run}")
    print(f"  Characters consumed this run: {chars_sent_this_run:,}")
    print(f"  Total scenes now cached: {completed}/{len(manifest['scenes'])}")


if __name__ == "__main__":
    main()
