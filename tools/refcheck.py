"""Look up references in local copies of open datasets (machine check only; see content/verification-log.md).

  refcheck.py hadith bukhari 3 4 3902        text of those hadith numbers
  refcheck.py search muslim "Kinana" "Hashim" hadith containing every term
  refcheck.py quran 96:1-5 2:185              verses (Arabic, Saheeh International, Bengali)

Datasets: fawazahmed0/hadith-api and fawazahmed0/quran-api, stored in .tools/hadith/.
Note: the Sahih Muslim edition there is NOT numbered by the Abd al-Baqi scheme.
"""

import json
import pathlib
import sys

DATA = pathlib.Path(__file__).resolve().parent.parent / ".tools" / "hadith"


def edition(name):
    return json.loads((DATA / f"eng-{name}.json").read_text())["hadiths"]


def show(name, hadith, limit=1400):
    grades = ", ".join(f"{g['name']}: {g['grade']}" for g in hadith.get("grades", []))
    print(f"--- {name} {hadith['hadithnumber']}  (book {hadith['reference']['book']}, no. {hadith['reference']['hadith']})  {grades}")
    print(hadith["text"][:limit])


def main():
    command, *args = sys.argv[1:]
    if command == "hadith":
        name, *numbers = args
        wanted = {float(n) for n in numbers}
        for hadith in edition(name):
            if float(hadith["hadithnumber"]) in wanted:
                show(name, hadith)
    elif command == "search":
        name, *terms = args
        terms = [term.lower() for term in terms]
        found = [h for h in edition(name) if all(term in h["text"].lower() for term in terms)]
        print(f"{len(found)} match(es)")
        for hadith in found[:6]:
            show(name, hadith, 700)
    elif command == "quran":
        editions = {key: json.loads((DATA / f"q-{key}.json").read_text())["quran"]
                    for key in ("ara-quranuthmanihaf", "eng-ummmuhammad", "ben-muhiuddinkhan")}
        for reference in args:
            chapter, verses = reference.split(":")
            first, _, last = verses.partition("-")
            for verse in range(int(first), int(last or first) + 1):
                print(f"--- {chapter}:{verse}")
                for rows in editions.values():
                    print(next(r["text"] for r in rows if r["chapter"] == int(chapter) and r["verse"] == verse))


if __name__ == "__main__":
    main()
