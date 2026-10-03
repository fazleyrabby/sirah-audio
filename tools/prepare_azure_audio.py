"""Prepare Azure TTS scene requests locally. This script makes no network calls.

Usage: python3 tools/prepare_azure_audio.py --lang en
       python3 tools/prepare_azure_audio.py --lang bn
       python3 tools/prepare_azure_audio.py --all

Writes prepared request files under .tools/azure/prepared/<lang>/ and a manifest
with the original subtitle IDs, character counts, and hashes.
"""

import argparse
import hashlib
import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "content/azure-narration.json"
OUTPUT = ROOT / ".tools/azure/prepared"


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


def prepare(language: str) -> tuple[int, int, int]:
    config = json.loads(CONFIG_PATH.read_text())
    settings = config[language]
    destination = OUTPUT / language
    destination.mkdir(parents=True, exist_ok=True)
    chapters = scenes = characters = 0
    manifest = []

    for folder in sorted((ROOT / "content/chapters").iterdir()):
        tts_file = folder / f"tts-{language}.json"
        if not tts_file.exists():
            continue
        chapters += 1
        tts = json.loads(tts_file.read_text())
        scene_items: dict[str, list[dict]] = {}
        for item in tts["items"]:
            scene_items.setdefault(item["sceneId"], []).append(item)

        for scene_id, items in scene_items.items():
            paragraphs: dict[int, list[str]] = {}
            for item in items:
                paragraphs.setdefault(item["para"], []).append(item["text"])
            transcript = "\n\n".join(" ".join(lines) for lines in paragraphs.values())
            transcript = transcript.replace(" ﷺ", settings["honorific"])
            if "ﷺ" in transcript:
                raise ValueError(f"unexpanded honorific: {folder.name} {scene_id}")

            characters += len(transcript)
            scenes += 1
            name = f"{folder.name}-{scene_id}"

            ssml = build_ssml(
                text=transcript,
                voice=settings["voice"],
                lang=settings["lang"],
                rate=settings.get("rate", "-8%"),
                pitch=settings.get("pitch", "0%"),
            )

            request_data = {
                "chapter": folder.name,
                "sceneId": scene_id,
                "voice": settings["voice"],
                "lang": settings["lang"],
                "rate": settings.get("rate", "-8%"),
                "pitch": settings.get("pitch", "0%"),
                "transcript": transcript,
                "ssml": ssml,
                "characters": len(transcript),
                "subtitles": [
                    {
                        "id": item["id"],
                        "para": item["para"],
                        "text": item["text"].replace(" ﷺ", settings["honorific"]),
                    }
                    for item in items
                ],
            }

            encoded = json.dumps(request_data, ensure_ascii=False, indent=2).encode()
            (destination / f"{name}.json").write_bytes(encoded)
            manifest.append({
                "chapter": folder.name,
                "sceneId": scene_id,
                "request": f"{name}.json",
                "sha256": hashlib.sha256(encoded).hexdigest(),
                "characters": len(transcript),
                "subtitleIds": [item["id"] for item in items],
            })

    manifest_data = {
        "language": language,
        "voice": settings["voice"],
        "rate": settings.get("rate", "-8%"),
        "pitch": settings.get("pitch", "0%"),
        "totalCharacters": characters,
        "totalScenes": scenes,
        "totalChapters": chapters,
        "scenes": manifest,
    }
    (destination / "manifest.json").write_text(
        json.dumps(manifest_data, ensure_ascii=False, indent=2) + "\n"
    )
    return chapters, scenes, characters


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=("en", "bn"))
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    if args.all:
        langs = ["en", "bn"]
    elif args.lang:
        langs = [args.lang]
    else:
        parser.error("Specify either --lang [en|bn] or --all")

    grand_total_chars = 0
    for lang in langs:
        ch, sc, chars = prepare(lang)
        grand_total_chars += chars
        print(f"{lang}: prepared {sc} scenes from {ch} chapters ({chars:,} characters)")
    if len(langs) > 1:
        print(f"Grand total characters across both languages: {grand_total_chars:,} / 500,000 F0 monthly limit")


if __name__ == "__main__":
    main()
