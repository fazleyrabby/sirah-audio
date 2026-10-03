"""Copy the Image and Audio direction lines from script-en.md into script-bn.md.

The Bengali script is written with scene headings and narration only; visuals are shared
between languages, so each scene takes the English scene's images with Bengali alt text.

Usage: bn_images.py content/chapters/NN-slug [...]
"""
import pathlib
import re
import sys

ALT = {
    "makkah/valley-dawn.svg": "পাহাড়ে ঘেরা উপত্যকার এক জনপদে ভোরের প্রথম আলো। কোনো মানুষ নেই।",
    "makkah/valley-night.svg": "তারাভরা রাতে উপত্যকার এক জনপদ। কোনো মানুষ নেই।",
    "makkah/homes-night.svg": "রাতের বেলা সমতল ছাদের ঘরবাড়ি, কয়েকটি জানালায় প্রদীপের আলো। কোনো মানুষ নেই।",
    "mountains/hira-night.svg": "সরু চাঁদ আর রাতের আকাশের নিচে এক রুক্ষ পাহাড়। কোনো মানুষ নেই।",
    "mountains/ridges-dusk.svg": "গোধূলিতে স্তরে স্তরে পাহাড়ের সারি। কোনো মানুষ নেই।",
    "desert/night-sky.svg": "অন্ধকার শৈলশিরার ওপরে তারাভরা বিস্তৃত রাতের আকাশ। কোনো মানুষ নেই।",
    "desert/dunes-dawn.svg": "ভোরের মরুভূমি, বালিয়াড়ির ওপর ছড়িয়ে পড়ছে আলো। কোনো মানুষ নেই।",
    "desert/dunes-day.svg": "ফ্যাকাশে আকাশের নিচে জনশূন্য বালিয়াড়ি। কোনো মানুষ নেই।",
    "desert/dunes-night.svg": "সরু চাঁদের নিচে রাতের বালিয়াড়ি। কোনো মানুষ নেই।",
    "desert/oasis-dusk.svg": "গোধূলিতে এক মরূদ্যানের খেজুরগাছ। কোনো মানুষ নেই।",
    "maps/arabia.svg": "আরব উপদ্বীপের মানচিত্র; মক্কা, ইয়াসরিব ও আশপাশের অঞ্চল চিহ্নিত।",
}
HEADING = re.compile(r"^## (s\d+) -- ")

for name in sys.argv[1:]:
    directory = pathlib.Path(name)
    images = {}
    scene = None
    for line in (directory / "script-en.md").read_text().splitlines():
        match = HEADING.match(line)
        if match:
            scene = match.group(1)
            images[scene] = []
        elif scene and line.startswith("Image:"):
            parts = [part.strip() for part in line[len("Image:"):].split("|")]
            parts[2] = ALT[parts[0]]
            images[scene].append("Image: " + " | ".join(parts))

    path = directory / "script-bn.md"
    lines = path.read_text().splitlines()
    out = []
    for index, line in enumerate(lines):
        out.append(line)
        match = HEADING.match(line)
        if match and not (index + 1 < len(lines) and lines[index + 1].startswith("Image:")):
            out.extend(images[match.group(1)])
            out.append("Audio: শুধু কণ্ঠ।")
    path.write_text("\n".join(out) + "\n")
    print(f"{directory.name}: {len(images)} scenes")
