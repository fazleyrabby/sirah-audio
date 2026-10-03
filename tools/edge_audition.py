"""Generate audition clips using edge-tts with Andrew and Pradeep neural voices.

Audio aesthetic: Soothing, calm, unhurried natural cadence (rate: -8%).

Usage:
  /Users/rabbi/miniconda3/envs/kokoro/bin/python tools/edge_audition.py
"""

import asyncio
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
AUDITIONS_DIR = ROOT / "auditions"

AUDITIONS = [
    {
        "filename": "edge-en-andrew-arabic-names.mp3",
        "voice": "en-US-AndrewNeural",
        "rate": "-8%",
        "pitch": "+0Hz",
        "title": "English Arabic Names (Andrew)",
        "text": "Allah. Muhammad, peace be upon him. Musa. Makkah. Qur'an. Jibril. Aishah. Khadijah.",
    },
    {
        "filename": "edge-en-andrew-context.mp3",
        "voice": "en-US-AndrewNeural",
        "rate": "-8%",
        "pitch": "+0Hz",
        "title": "English Chapter 07 Context Passage (Andrew)",
        "text": "The Messenger of Allah, peace be upon him, had reached the age of forty. In the month of Ramadan, in the cave of Hira on the Mountain of Light above Makkah, the angel Jibril came to him with the first revelation of the Qur'an. Aishah narrated that the first sign given to him was the true dream in sleep.",
    },
    {
        "filename": "edge-bn-pradeep-arabic-names.mp3",
        "voice": "bn-BD-PradeepNeural",
        "rate": "-8%",
        "pitch": "+0Hz",
        "title": "Bengali Arabic Names (Pradeep)",
        "text": "আল্লাহ। মুহাম্মাদ সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম। মূসা। মক্কা। কুরআন। জিবরিল। আয়েশা। খাদিজা।",
    },
    {
        "filename": "edge-bn-pradeep-context.mp3",
        "voice": "bn-BD-PradeepNeural",
        "rate": "-8%",
        "pitch": "+0Hz",
        "title": "Bengali Chapter 07 Context Passage (Pradeep)",
        "text": "আল্লাহর রাসুল সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম চল্লিশ বছর বয়সে পৌঁছালেন। রমজান মাসে, মক্কার নূর পর্বতের হেরা গুহায়, ফেরেশতা জিবরিল তাঁর কাছে কুরআনের প্রথম ওহি নিয়ে এলেন। আয়েশা বর্ণনা করেছেন, ওহি শুরুর পূর্বে তিনি যা দেখতেন তা ভোরের আলোর মতো সত্য স্বপ্ন হিসেবে প্রকাশ পেত।",
    },
]


async def generate_clip(item: dict) -> None:
    out_path = AUDITIONS_DIR / item["filename"]
    print(f"Generating {item['title']} -> auditions/{item['filename']} ...")
    communicate = edge_tts.Communicate(
        text=item["text"],
        voice=item["voice"],
        rate=item["rate"],
        pitch=item["pitch"],
    )
    await communicate.save(str(out_path))
    size = out_path.stat().st_size
    print(f"  ✓ Saved {item['filename']} ({size:,} bytes)")


async def main() -> None:
    AUDITIONS_DIR.mkdir(parents=True, exist_ok=True)
    for item in AUDITIONS:
        await generate_clip(item)
    print("\nAll audition clips generated successfully!")


if __name__ == "__main__":
    asyncio.run(main())
