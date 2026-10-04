"""Inventory Arabic-derived names and terms in the 37 Bengali scripts.

Counts inflected forms (pattern + trailing Bengali letters) across every
content/chapters/*/tts-bn.json item, and writes content/pronunciation-bn.json
as { english_name: {"bn": [spellings], "count": N} }.

Usage: python3 tools/bn_names.py [--report]
"""

import argparse
import collections
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

NAMES = {
    "Allah": ["আল্লাহ"],
    "Rasulullah": ["রাসূলুল্লাহ"],
    "Rasul": ["রাসূল"],
    "Nabi": ["নবী"],
    "Muhammad": ["মুহাম্মাদ", "মুহম্মদ", "মোহাম্মদ"],
    "Makkah": ["মক্কা"],
    "Madinah": ["মদিনা", "মদীনা"],
    "Quran": ["কুরআন", "কোরআন"],
    "Hira": ["হেরা"],
    "Khadijah": ["খাদিজা"],
    "Aishah": ["আয়েশা", "আয়িশা"],
    "Waraqah": ["ওয়ারাকা", "ওরাকা"],
    "Nawfal": ["নওফল", "নওফেল"],
    "Ibn": ["ইবনে", "ইবন"],
    "Ali": ["আলী"],
    "Umar": ["উমর", "ওমর"],
    "Uthman": ["উসমান", "ওসমান"],
    "Abu Bakr": ["আবু বকর"],
    "Bakr": ["বকর"],
    "Bilal": ["বিলাল"],
    "Quraysh": ["কুরাইশ"],
    "Kabah": ["কাবা"],
    "Jibril": ["জিবরাইল", "জিব্রিল", "জিবরিল"],
    "Ibrahim": ["ইব্রাহীম", "ইবরাহিম"],
    "Ismail": ["ইসমাইল", "ইসমাঈল"],
    "Musa": ["মূসা", "মুসা"],
    "Namus": ["নামুস"],
    "Hijaz": ["হিজাজ"],
    "Aminah": ["আমিনা"],
    "Halimah": ["হালিমা"],
    "Thuwaybah": ["সুওয়াইবা", "থুওয়াইবা"],
    "Banu Sad": ["বনু সাদ"],
    "Abd al-Muttalib": ["আবদুল মুত্তালিব"],
    "Muttalib": ["মুত্তালিব"],
    "Rabi al-Awwal": ["রবিউল আউয়াল"],
    "al-Lat": ["লাত"],
    "Manat": ["মানাত"],
    "Luhayy": ["লুহাই"],
    "Khuzaah": ["খুজাআ", "খুজা"],
    "Jabir": ["জাবির"],
    "Kinanah": ["কিনানা"],
    "Zuhrah": ["জুহরা"],
    "Najran": ["নাজরান"],
    "Badr": ["বদর"],
    "Uhud": ["উহুদ"],
    "Hunayn": ["হুনাইন"],
    "Tabuk": ["তাবুক"],
    "Hudaybiyyah": ["হুদায়বিয়া", "হুদাইবিয়্যা"],
    "Khaybar": ["খায়বার"],
    "Thawr": ["সাওর", "ছাওর"],
    "Quba": ["কুবা"],
    "Fatimah": ["ফাতিমা"],
    "Hamzah": ["হামজা"],
    "Zubayr": ["জুবাইর"],
    "Talhah": ["তালহা"],
    "Usamah": ["উসামা"],
    "Jafar": ["জাফর"],
    "Musab": ["মুসআব"],
    "Muadh": ["মুআজ"],
    "Salman": ["সালমান"],
    "Suhayb": ["সুহাইব"],
    "Ammar": ["আম্মার"],
    "Yasir": ["ইয়াসির"],
    "Sumayyah": ["সুমাইয়া"],
    "Khabbab": ["খাব্বাব"],
    "Suhayl": ["সুহাইল"],
    "Khalid": ["খালিদ"],
    "Amr": ["আমর"],
    "Walid": ["ওয়ালিদ"],
    "Ubaydah": ["উবাইদা"],
    "Abdullah": ["আবদুল্লাহ"],
    "Ruqayyah": ["রুকাইয়্যা", "রুকাইয়া"],
    "Umm Kulthum": ["উম্মে কুলসুম"],
    "Kulthum": ["কুলসুম"],
    "Safiyyah": ["সাফিয়্যা", "সাফিয়া"],
    "Juwayriyah": ["জুওয়াইরিয়া"],
    "Maymunah": ["মাইমুনা"],
    "Umm Ayman": ["উম্মে আয়মান"],
    "Barakah": ["বারাকা"],
    "Isa": ["ঈসা"],
    "Yusuf": ["ইউসুফ"],
    "Yunus": ["ইউনুস"],
    "Harun": ["হারুন"],
    "Yahya": ["ইয়াহইয়া"],
    "Idris": ["ইদরিস"],
    "Adam": ["আদম"],
    "Ansar": ["আনসার"],
    "Muhajirun": ["মুহাজির"],
    "Abraha": ["আবরাহা"],
    "Bahira": ["বাহিরা"],
    "Buraq": ["বুরাক"],
    "al-Uzza": ["উজ্জা"],
    "Hubal": ["হুবাল"],
    "Zamzam": ["জমজম"],
    "Safa": ["সাফা"],
    "Marwah": ["মারওয়া"],
    "Arafah": ["আরাফা"],
    "Mina": ["মিনা"],
    "Yathrib": ["ইয়াসরিব"],
    "Aqabah": ["আকাবা"],
    "Sahaba": ["সাহাবি", "সাহাবা"],
    "Islam": ["ইসলাম"],
    "Iman": ["ঈমান"],
    "Wahi": ["ওহি"],
    "Hadith": ["হাদিস", "হাদীস"],
    "Sirah": ["সীরাত", "সিরাত"],
    "Hijrah": ["হিজরত", "হিজরা"],
    "Jahiliyyah": ["জাহিলিয়্যা", "জাহেলি"],
    "Ramadan": ["রমজান"],
    "Laylat al-Qadr": ["লাইলাতুল কদর"],
    "Malaika": ["ফেরেশতা"],
    "Salat": ["নামাজ"],
    "Munafiq": ["মুনাফিক"],
    "Kafir": ["কাফির"],
    "Shirk": ["শিরক"],
    "Tawhid": ["তাওহিদ"],
    "Sunni": ["সুন্নি"],
    "Shia": ["শিয়া"],
    "Sahih": ["সহিহ"],
    "Sufyan": ["সুফিয়ান"],
    "Hashim": ["হাশিম"],
    "Umm": ["উম্মে"],
    "Talib": ["তালিব"],
    "Salamah": ["সালামা"],
    "Masud": ["মাসউদ"],
    "Zayd": ["জায়েদ", "জায়দ"],
    "Barra": ["বারা"],
    "Ayah": ["আয়াত"],
    "Salam": ["সালাম"],
}


def load_texts() -> str:
    parts = []
    for path in sorted((ROOT / "content/chapters").glob("*/tts-bn.json")):
        data = json.loads(path.read_text("utf-8"))
        parts.extend(item.get("text", "") for item in data.get("items", []))
    return "\n".join(parts)


def count_forms(blob: str) -> dict:
    result = {}
    for english, spellings in NAMES.items():
        total = 0
        for spelling in spellings:
            pattern = re.compile(rf"(?<![\u0980-\u09FF]){re.escape(spelling)}[\u0980-\u09FF]*")
            total += len(pattern.findall(blob))
        result[english] = {"bn": spellings, "count": total}
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", action="store_true", help="Print a table sorted by count")
    args = parser.parse_args()

    blob = load_texts()
    result = count_forms(blob)

    out = ROOT / "content/pronunciation-bn.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", "utf-8")

    present = {k: v for k, v in result.items() if v["count"]}
    missing = [k for k, v in result.items() if not v["count"]]
    print(f"Wrote {out}")
    print(f"{len(present)}/{len(result)} terms found; total name occurrences: {sum(v['count'] for v in result.values())}")
    if args.report:
        for english, data in sorted(present.items(), key=lambda kv: -kv[1]["count"]):
            print(f"{data['count']:5d}  {english:18s} {'/'.join(data['bn'])}")
        if missing:
            print("\nnot found:", ", ".join(missing))


if __name__ == "__main__":
    main()
