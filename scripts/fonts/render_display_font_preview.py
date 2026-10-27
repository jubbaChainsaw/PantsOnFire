#!/usr/bin/env python3
"""Old vs PoF Display comparison sheet (yellow on dark, mobile-ish sizes)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OLD_FONT = ROOT / "public/assets/fonts/pants-on-fire/PantsOnFireNarrow-Regular.ttf"
NEW_FONT = ROOT / "public/assets/fonts/pants-on-fire/derived/PoFDisplay-Narrow-Regular.ttf"
OUT = ROOT / "public/assets/fonts/pants-on-fire/derived/pof-display-comparison.png"

PHRASES = [
    ("CHOOSE THE NEXT CATEGORY", 26),
    ("PASS THE PHONE TO NAOMI", 22),
    ("REVEAL RESULTS", 24),
    ("abcdeghopqrs ABDEGOPQR 0123456789", 18),
]

BG = (5, 1, 15)
YELLOW = (253, 224, 71)
LABEL = (148, 163, 184)
WIDTH = 360
PAD = 16


def load_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def main() -> None:
    row_h = 0
    blocks = []
    for text, size in PHRASES:
        old_f = load_font(OLD_FONT, size)
        new_f = load_font(NEW_FONT, size)
        old_box = ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox(
            (0, 0), text, font=old_f
        )
        new_box = ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox(
            (0, 0), text, font=new_f
        )
        h = max(old_box[3] - old_box[1], new_box[3] - new_box[1]) + 8
        blocks.append((text, size, h))
        row_h += h + 36

    height = PAD * 2 + 40 + row_h + 20
    img = Image.new("RGB", (WIDTH, height), BG)
    draw = ImageDraw.Draw(img)
    draw.text((PAD, PAD), "Pants on Fire Narrow (current)", fill=LABEL, font=load_font(OLD_FONT, 14))
    draw.text((WIDTH // 2 + 4, PAD), "PoF Display (derived)", fill=LABEL, font=load_font(OLD_FONT, 14))

    y = PAD + 28
    for text, size, h in blocks:
        old_f = load_font(OLD_FONT, size)
        new_f = load_font(NEW_FONT, size)
        draw.text((PAD, y), text, fill=YELLOW, font=old_f)
        draw.text((WIDTH // 2 + 4, y), text, fill=YELLOW, font=new_f)
        y += h + 36

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT)
    print(f"Saved {OUT} ({WIDTH}x{height})")


if __name__ == "__main__":
    main()
