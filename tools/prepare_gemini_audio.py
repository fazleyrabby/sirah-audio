"""Prepare Gemini TTS scene requests locally. This script makes no network calls.

Usage: python3 tools/prepare_gemini_audio.py --lang en
       python3 tools/prepare_gemini_audio.py --lang bn

Writes ignored request files under .tools/gemini/prepared/<lang>/ and a manifest
with the original subtitle IDs. Never uses Kokoro-specific spoken respellings.
"""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / "content/gemini-narration.json").read_text())
OUTPUT = ROOT / ".tools/gemini/prepared"


def prepare(language: str) -> tuple[int, int, int]:
    settings = CONFIG[language]
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
            request = {
                "model": CONFIG["model"],
                "input": [{
                    "type": "user_input",
                    "content": [{
                        "type": "text",
                        "text": transcript,
                        "annotations": [{"type": "speech_metadata", "style": settings["style"]}],
                    }],
                }],
                "response_format": {"type": "audio"},
                "generation_config": {"speech_config": [{"voice": settings["voice"]}]},
            }
            encoded = json.dumps(request, ensure_ascii=False, sort_keys=True).encode()
            (destination / f"{name}.json").write_bytes(encoded)
            manifest.append({
                "chapter": folder.name,
                "sceneId": scene_id,
                "request": f"{name}.json",
                "sha256": hashlib.sha256(encoded).hexdigest(),
                "characters": len(transcript),
                "subtitleIds": [item["id"] for item in items],
            })

    (destination / "manifest.json").write_text(
        json.dumps({"language": language, "model": CONFIG["model"], "scenes": manifest},
                   ensure_ascii=False, indent=2) + "\n"
    )
    return chapters, scenes, characters


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=("en", "bn"), required=True)
    args = parser.parse_args()
    chapters, scenes, characters = prepare(args.lang)
    print(f"{args.lang}: prepared {scenes} scenes from {chapters} chapters ({characters:,} characters); no API calls")


if __name__ == "__main__":
    main()
