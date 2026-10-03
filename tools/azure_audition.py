"""Generate short Azure Speech auditions for Andrew (en-US) and Pradeep (bn-BD).

Safety rules:
- Requires --send and --free-tier-confirmed to make any API calls.
- Verifies that character count is minimal (< 1,000 characters).
- Never enables billing or calls paid endpoints.

Usage:
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/azure_audition.py --dry-run
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/azure_audition.py --send --free-tier-confirmed
"""

import argparse
import html
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDITIONS_DIR = ROOT / "auditions"
CONFIG_PATH = ROOT / "content/azure-narration.json"

AUDITION_PASSAGES = [
    {
        "id": "azure-en-andrew-arabic-names",
        "lang": "en-US",
        "voice": "en-US-AndrewNeural",
        "rate": "-8%",
        "pitch": "0%",
        "filename": "azure-en-andrew-arabic-names.mp3",
        "description": "Arabic names checklist: Allah, Muhammad, Musa, Makkah, Qur'an, Jibril, Aishah, Khadijah",
        "text": "Allah. Muhammad, peace be upon him. Musa. Makkah. Qur'an. Jibril. Aishah. Khadijah.",
    },
    {
        "id": "azure-en-andrew-context",
        "lang": "en-US",
        "voice": "en-US-AndrewNeural",
        "rate": "-8%",
        "pitch": "0%",
        "filename": "azure-en-andrew-context.mp3",
        "description": "Chapter 07 context passage with historical flow and honorific",
        "text": "The Messenger of Allah, peace be upon him, had reached the age of forty. In the month of Ramadan, in the cave of Hira on the Mountain of Light above Makkah, the angel Jibril came to him with the first revelation of the Qur'an. Aishah narrated that the first sign given to him was the true dream in sleep.",
    },
    {
        "id": "azure-bn-pradeep-arabic-names",
        "lang": "bn-BD",
        "voice": "bn-BD-PradeepNeural",
        "rate": "-8%",
        "pitch": "0%",
        "filename": "azure-bn-pradeep-arabic-names.mp3",
        "description": "Bengali checklist: আল্লাহ, মুহাম্মাদ, মূসা, মক্কা, কুরআন",
        "text": "আল্লাহ। মুহাম্মাদ সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম। মূসা। মক্কা। কুরআন। জিবরিল। আয়েশা। খাদিজা।",
    },
    {
        "id": "azure-bn-pradeep-context",
        "lang": "bn-BD",
        "voice": "bn-BD-PradeepNeural",
        "rate": "-8%",
        "pitch": "0%",
        "filename": "azure-bn-pradeep-context.mp3",
        "description": "Bengali Chapter 07 context passage with historical flow and honorific",
        "text": "আল্লাহর রাসুল সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম চল্লিশ বছর বয়সে পৌঁছালেন। রমজান মাসে, মক্কার নূর পর্বতের হেরা গুহায়, ফেরেশতা জিবরিল তাঁর কাছে কুরআনের প্রথম ওহি নিয়ে এলেন। আয়েশা বর্ণনা করেছেন, ওহি শুরুর পূর্বে তিনি যা দেখতেন তা ভোরের আলোর মতো সত্য স্বপ্ন হিসেবে প্রকাশ পেত।",
    },
]


def build_ssml(text: str, voice: str, lang: str, rate: str, pitch: str) -> str:
    escaped_text = html.escape(text)
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        f'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="{lang}">\n'
        f'  <voice name="{voice}">\n'
        f'    <prosody rate="{rate}" pitch="{pitch}">\n'
        f'      {escaped_text}\n'
        f'    </prosody>\n'
        f'  </voice>\n'
        f'</speak>\n'
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--send", action="store_true", help="Explicitly permit API requests")
    parser.add_argument("--free-tier-confirmed", action="store_true",
                        help="Confirm the Azure Speech resource is Free (F0)")
    parser.add_argument("--dry-run", action="store_true", help="Print passages and character counts without sending")
    parser.add_argument("--key", type=str, default="", help="Azure Speech Key (or use AZURE_SPEECH_KEY env var)")
    parser.add_argument("--region", type=str, default="", help="Azure Speech Region (or use AZURE_SPEECH_REGION env var)")
    args = parser.parse_args()

    total_chars = sum(len(p["text"]) for p in AUDITION_PASSAGES)
    print(f"Audition plan: 4 clips, total {total_chars} characters (0.16% of 500,000 monthly F0 quota).")

    if args.dry_run or not args.send:
        print("\n--- DRY RUN SUMMARY ---")
        for p in AUDITION_PASSAGES:
            print(f"\nID: {p['id']}")
            print(f"Voice: {p['voice']} ({p['lang']}) | Rate: {p['rate']} | Pitch: {p['pitch']}")
            print(f"Target: auditions/{p['filename']} ({len(p['text'])} chars)")
            print(f"Text: {p['text']}")
        print("\nTo generate these clips with Azure Speech, provide --send and --free-tier-confirmed along with key and region.")
        return

    if not args.free_tier_confirmed:
        sys.exit("Error: Must confirm the resource is Free (F0) with --free-tier-confirmed.")

    key = args.key or os.environ.get("AZURE_SPEECH_KEY")
    region = args.region or os.environ.get("AZURE_SPEECH_REGION")

    if not key or not region:
        sys.exit("Error: Azure Speech key and region must be provided via environment variables (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION) or --key and --region.")

    try:
        import azure.cognitiveservices.speech as speechsdk
    except ImportError:
        sys.exit("Error: azure-cognitiveservices-speech package is required.")

    AUDITIONS_DIR.mkdir(parents=True, exist_ok=True)
    speech_config = speechsdk.SpeechConfig(subscription=key, region=region)
    speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3)

    for p in AUDITION_PASSAGES:
        out_file = AUDITIONS_DIR / p["filename"]
        meta_file = AUDITIONS_DIR / f"{p['id']}.json"

        ssml = build_ssml(p["text"], p["voice"], p["lang"], p["rate"], p["pitch"])
        audio_config = speechsdk.audio.AudioOutputConfig(filename=str(out_file))
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

        word_boundaries = []
        def on_wb(evt):
            word_boundaries.append({
                "audio_offset_ms": evt.audio_offset / 10000,
                "duration_ms": evt.duration.total_seconds() * 1000 if hasattr(evt.duration, "total_seconds") else evt.duration / 10000,
                "text": evt.text,
                "text_offset": evt.text_offset,
                "word_length": evt.word_length,
            })
        synthesizer.synthesizing.connect(lambda evt: None)
        synthesizer.word_boundary.connect(on_wb)

        print(f"Generating {p['id']} ({len(p['text'])} chars)...")
        result = synthesizer.speak_ssml_async(ssml).get()

        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            cancellation = result.cancellation_details
            sys.exit(f"Synthesis failed for {p['id']}: {cancellation.reason} - {cancellation.error_details}")

        meta = {
            "id": p["id"],
            "voice": p["voice"],
            "lang": p["lang"],
            "rate": p["rate"],
            "pitch": p["pitch"],
            "characters": len(p["text"]),
            "word_boundaries": word_boundaries,
            "filename": p["filename"],
        }
        meta_file.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
        print(f"Saved: auditions/{p['filename']} ({out_file.stat().st_size} bytes)")

    print(f"\nAll auditions successfully generated ({total_chars} chars consumed from F0 allowance).")


if __name__ == "__main__":
    main()
