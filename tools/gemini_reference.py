"""Send one custom text to Gemini TTS and save the WAV, for building reference audio.

Uses the same Interactions endpoint, request shape and cost accounting as
tools/gemini_generate_scenes.py. Never sends without --send.

Usage:
  python3 tools/gemini_reference.py --text-file ref.txt --out auditions/foo.wav --send
"""

import argparse
import base64
import json
import os
import subprocess
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / "content/gemini-narration.json").read_text())
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"
CONFIRMED_FREE_KEY_SUFFIX = "Ib4s"
INPUT_USD_PER_MILLION = 0.50
OUTPUT_USD_PER_MILLION = 9.00


def estimated_cost(usage: dict) -> float:
    return (usage.get("total_input_tokens", 0) * INPUT_USD_PER_MILLION
            + usage.get("total_output_tokens", 0) * OUTPUT_USD_PER_MILLION) / 1_000_000


def build_body(text: str, language: str) -> bytes:
    settings = CONFIG[language]
    body = {
        "generation_config": {"speech_config": [{"voice": settings["voice"]}]},
        "input": [{
            "content": [{
                "annotations": [{"style": settings["style"], "type": "speech_metadata"}],
                "text": text,
                "type": "text",
            }],
            "type": "user_input",
        }],
        "model": CONFIG["model"],
        "response_format": {"type": "audio"},
    }
    return json.dumps(body, ensure_ascii=False).encode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text")
    parser.add_argument("--text-file", type=Path)
    parser.add_argument("--lang", choices=("en", "bn"), default="bn")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--send", action="store_true")
    args = parser.parse_args()

    text = args.text_file.read_text("utf-8").strip() if args.text_file else args.text
    if not text:
        parser.error("provide --text or --text-file")
    if not args.out.is_absolute():
        args.out = ROOT / args.out

    body = build_body(text, args.lang)
    print(f"chars: {len(text)}; voice: {CONFIG[args.lang]['voice']}; out: {args.out}")
    if not args.send:
        print("Dry run only: no content sent. Re-run with --send.")
        return

    key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")
    if not key:
        parser.error("GOOGLE_GENERATIVE_AI_API_KEY is not set")
    if not key.endswith(CONFIRMED_FREE_KEY_SUFFIX):
        parser.error("key is not the free-tier key whose allowance was confirmed")

    call = request.Request(
        ENDPOINT, data=body,
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(call, timeout=180) as response:
            result = json.load(response)
    except error.HTTPError as exc:
        raise RuntimeError(f"Gemini returned HTTP {exc.code}; no content printed") from exc

    if result.get("status") != "completed":
        raise RuntimeError(f"Gemini did not complete: status={result.get('status')}")
    audio = [block for step in result.get("steps", [])
             if step.get("type") == "model_output"
             for block in step.get("content", []) if block.get("type") == "audio"]
    if len(audio) != 1:
        raise RuntimeError(f"expected one audio block, got {len(audio)}")

    pcm = base64.b64decode(audio[0]["data"])
    if pcm[:4] != b"RIFF":
        raise RuntimeError("expected WAV audio")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    if args.out.suffix.lower() == ".mp3":
        wav = args.out.with_suffix(".wav")
        wav.write_bytes(pcm)
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "1",
             "-codec:a", "libmp3lame", "-b:a", "128k", str(args.out)],
            check=True,
        )
        wav.unlink(missing_ok=True)
    else:
        args.out.write_bytes(pcm)
    usage = result.get("usage", {})
    meta = args.out.with_suffix(".json")
    meta.write_text(json.dumps({
        "text": text, "lang": args.lang, "voice": CONFIG[args.lang]["voice"],
        "usage": usage, "estimated_paid_tier_usd": round(estimated_cost(usage), 6),
    }, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"saved {args.out} ({len(pcm)} bytes); est. paid-tier ${estimated_cost(usage):.4f} (free tier expected)")


if __name__ == "__main__":
    main()
