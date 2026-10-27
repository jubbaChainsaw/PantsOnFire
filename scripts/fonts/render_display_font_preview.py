#!/usr/bin/env python3
"""Old vs PoF Display comparison sheet (yellow on dark, 360px mobile width)."""
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
GAP = 10


def load_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def text_height(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), text, font=font)
    return box[3] - box[1]


def main() -> None:
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    label_font = load_font(OLD_FONT, 11)

    y = PAD
    for text, size in PHRASES:
        old_f = load_font(OLD_FONT, size)
        new_f = load_font(NEW_FONT, size)
        y += text_height(probe, "OLD", label_font) + 4
        y += max(text_height(probe, text, old_f), text_height(probe, text, new_f)) + 4
        y += text_height(probe, "NEW", label_font) + 4
        y += max(text_height(probe, text, new_f), text_height(probe, text, old_f)) + GAP + 20

    height = y + PAD
    img = Image.new("RGB", (WIDTH, height), BG)
    draw = ImageDraw.Draw(img)

    y = PAD
    draw.text((PAD, y), "Pants on Fire Narrow → PoF Display", fill=LABEL, font=label_font)
    y += 22

    for text, size in PHRASES:
        old_f = load_font(OLD_FONT, size)
        new_f = load_font(NEW_FONT, size)

        draw.text((PAD, y), "Current", fill=LABEL, font=label_font)
        y += 14
        draw.text((PAD, y), text, fill=YELLOW, font=old_f)
        y += text_height(draw, text, old_f) + GAP

        draw.text((PAD, y), "PoF Display", fill=LABEL, font=label_font)
        y += 14
        draw.text((PAD, y), text, fill=YELLOW, font=new_f)
        y += text_height(draw, text, new_f) + 20

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT)
    print(f"Saved {OUT} ({WIDTH}x{height})")


if __name__ == "__main__":
    main()
