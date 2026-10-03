"""Append <!-- n --> to script paragraphs that carry no claim marker (lead-in lines).

Usage: mark_narration.py content/chapters/NN-slug/script-en.md [...]
Prints each paragraph it marks so the choice can be reviewed.
"""
import pathlib
import re
import sys

for name in sys.argv[1:]:
    path = pathlib.Path(name)
    blocks = path.read_text().split("\n\n")
    in_scene = False
    for index, block in enumerate(blocks):
        lines = block.strip("\n").split("\n")
        if any(line.startswith("## ") for line in lines):
            in_scene = True
        narration = [line for line in lines if line and not re.match(r"^(#|Image:|Audio:|Visual:|Source:|<!--|-->)", line)]
        if not in_scene or not narration or "<!--" in block.split("\n## ")[-1] and any("<!--" in line for line in narration):
            continue
        last = max(i for i, line in enumerate(lines) if line in narration)
        lines[last] += " <!-- n -->"
        blocks[index] = "\n".join(lines)
        print(f"{path.parent.name}: n  <- {narration[0][:70]}")
    path.write_text("\n\n".join(blocks))
