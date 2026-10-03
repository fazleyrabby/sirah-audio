"""Generate prepared Gemini TTS scenes on a manually confirmed Free-tier project.

This tool never sends a request without --send and --free-tier-confirmed. Check
the project's Billing Tier in Google AI Studio before each day's run. It writes individual
WAV files and usage metadata so a stopped run can resume without regenerating
completed scenes. Prepare inputs first with prepare_gemini_audio.py.

Usage: python3 tools/gemini_generate_scenes.py --lang en --send --free-tier-confirmed
"""

import argparse
import base64
import json
import os
from pathlib import Path
from urllib import error, request


ROOT = Path(__file__).resolve().parent.parent
PREPARED = ROOT / ".tools/gemini/prepared"
GENERATED = ROOT / ".tools/gemini/generated"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"
CONFIRMED_FREE_KEY_SUFFIX = "Ib4s"  # Confirmed in AI Studio on 2026-10-03.

# Published standard paid-tier Gemini 3.8 Flash TTS rates through 2026-12-31.
# We conservatively count all reported input tokens at the text-input rate.
INPUT_USD_PER_MILLION = 0.50
OUTPUT_USD_PER_MILLION = 9.00


def estimated_cost(usage: dict) -> float:
    return (usage.get("total_input_tokens", 0) * INPUT_USD_PER_MILLION
            + usage.get("total_output_tokens", 0) * OUTPUT_USD_PER_MILLION) / 1_000_000


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=("en", "bn"), required=True)
    parser.add_argument("--send", action="store_true", help="Explicitly permit API requests")
    parser.add_argument("--free-tier-confirmed", action="store_true",
                        help="Confirm that this API key's project currently shows Free tier in Google AI Studio")
    parser.add_argument("--max-new-scenes", type=int, default=10,
                        help="Maximum new requests this run; cannot exceed the observed 10/day Free-tier limit")
    args = parser.parse_args()
    if not 1 <= args.max_new_scenes <= 10:
        parser.error("--max-new-scenes must be between 1 and 10")
    if args.send and not args.free_tier_confirmed:
        parser.error("Recheck the API project's Free tier in Google AI Studio before sending")

    source = PREPARED / args.lang
    manifest = json.loads((source / "manifest.json").read_text())
    destination = GENERATED / args.lang
    destination.mkdir(parents=True, exist_ok=True)
    key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")
    if args.send and not key:
        parser.error("GOOGLE_GENERATIVE_AI_API_KEY is not set")
    if args.send and not key.endswith(CONFIRMED_FREE_KEY_SUFFIX):
        parser.error("The configured key is not the key whose Free tier was confirmed")

    completed = 0
    sent_now = 0
    for entry in manifest["scenes"]:
        stem = Path(entry["request"]).stem
        wav = destination / f"{stem}.wav"
        meta = destination / f"{stem}.json"
        if wav.exists() and meta.exists():
            previous = json.loads(meta.read_text())
            if previous.get("request_sha256") == entry["sha256"]:
                completed += 1
                continue
        if not args.send:
            continue

        if sent_now >= args.max_new_scenes:
            print(f"Stopped after {sent_now} new requests; daily run limit reached")
            break
        body = (source / entry["request"]).read_bytes()
        call = request.Request(
            ENDPOINT,
            data=body,
            headers={"x-goog-api-key": key, "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(call, timeout=180) as response:
                result = json.load(response)
        except error.HTTPError as exc:
            # The response can contain user data; do not print it or the key.
            raise RuntimeError(f"Gemini returned HTTP {exc.code} at {stem}; run stopped") from exc

        if result.get("status") != "completed":
            raise RuntimeError(f"Gemini did not complete {stem}; run stopped")
        audio = [block for step in result.get("steps", [])
                 if step.get("type") == "model_output"
                 for block in step.get("content", []) if block.get("type") == "audio"]
        if len(audio) != 1:
            raise RuntimeError(f"Expected one audio block for {stem}; run stopped")
        pcm = base64.b64decode(audio[0]["data"])
        if pcm[:4] != b"RIFF":
            raise RuntimeError(f"Expected WAV audio for {stem}; run stopped")
        usage = result.get("usage", {})
        wav.write_bytes(pcm)
        meta.write_text(json.dumps({
            "request_sha256": entry["sha256"], "usage": usage,
            "estimated_paid_tier_usd": round(estimated_cost(usage), 6),
            "model": manifest["model"], "sceneId": entry["sceneId"],
        }, indent=2) + "\n")
        completed += 1
        sent_now += 1
        print(f"{args.lang} {completed}/{len(manifest['scenes'])} {stem}: {sent_now} sent this run")

    print(f"{args.lang}: {completed}/{len(manifest['scenes'])} scenes cached; {sent_now} sent this run")
    if not args.send:
        print("Dry run only: no content sent and no API usage")


if __name__ == "__main__":
    main()
