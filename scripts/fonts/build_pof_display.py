#!/usr/bin/env python3
"""Build PoF Display — lighter Pants on Fire Narrow with more open counters.

Uses planar offset (negative buffer) on flattened glyph outlines. Not wired into the app.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from shapely import affinity
from shapely.geometry import MultiPolygon, Polygon
from shapely.ops import unary_union


def flatten_recording(recording, curve_steps: int = 10) -> list[list[tuple[float, float]]]:
    contours: list[list[tuple[float, float]]] = []
    current: list[tuple[float, float]] = []

    def cubic(p0, p1, p2, p3, steps: int) -> list[tuple[float, float]]:
        pts: list[tuple[float, float]] = []
        for i in range(1, steps + 1):
            t = i / steps
            x = (
                (1 - t) ** 3 * p0[0]
                + 3 * (1 - t) ** 2 * t * p1[0]
                + 3 * (1 - t) * t**2 * p2[0]
                + t**3 * p3[0]
            )
            y = (
                (1 - t) ** 3 * p0[1]
                + 3 * (1 - t) ** 2 * t * p1[1]
                + 3 * (1 - t) * t**2 * p2[1]
                + t**3 * p3[1]
            )
            pts.append((x, y))
        return pts

    for op, args in recording:
        if op == "moveTo":
            if current:
                contours.append(current)
            current = [tuple(args[0])]
        elif op == "lineTo":
            current.append(tuple(args[0]))
        elif op == "qCurveTo":
            for p in args:
                current.append(tuple(p))
        elif op == "curveTo":
            p0 = current[-1]
            p1, p2, p3 = tuple(args[0]), tuple(args[1]), tuple(args[2])
            current.extend(cubic(p0, p1, p2, p3, curve_steps))
            current[-1] = p3
        elif op == "closePath":
            if current and current[0] != current[-1]:
                current.append(current[0])
            contours.append(current)
            current = []

    if current:
        contours.append(current)
    return contours


def contours_to_polygon(contours: list[list[tuple[float, float]]]) -> Polygon | None:
    polys: list[Polygon] = []
    for contour in contours:
        if len(contour) < 3:
            continue
        try:
            polys.append(Polygon(contour))
        except Exception:
            continue
    if not polys:
        return None
    polys = [p for p in polys if p.is_valid and not p.is_empty]
    if not polys:
        return None
    polys.sort(key=lambda p: abs(p.area), reverse=True)
    outer = polys[0]
    holes = []
    for p in polys[1:]:
        if outer.contains(p.centroid):
            holes.append(list(p.exterior.coords))
    try:
        merged = Polygon(outer.exterior.coords, holes)
    except Exception:
        merged = unary_union(polys)
    if isinstance(merged, MultiPolygon):
        merged = max(merged.geoms, key=lambda g: g.area)
    return merged if isinstance(merged, Polygon) else None


def glyph_bounds(glyph_set, glyph_name: str):
    pen = BoundsPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return pen.bounds


def polygon_to_pen(poly: Polygon, pen: TTGlyphPen) -> None:
    if poly.is_empty:
        return
    if isinstance(poly, MultiPolygon):
        for part in poly.geoms:
            polygon_to_pen(part, pen)
        return

    exterior = list(poly.exterior.coords)
    if len(exterior) < 3:
        return
    pen.moveTo(exterior[0])
    for pt in exterior[1:]:
        pen.lineTo(pt)
    pen.closePath()

    for ring in poly.interiors:
        coords = list(ring.coords)
        if len(coords) < 3:
            continue
        pen.moveTo(coords[0])
        for pt in coords[1:]:
            pen.lineTo(pt)
        pen.closePath()


def thin_glyph(
    glyph_set,
    glyph_name: str,
    inset_units: float,
    curve_steps: int,
) -> object | None:
    if glyph_name not in glyph_set:
        return None
    pen = RecordingPen()
    glyph_set[glyph_name].draw(pen)
    if not pen.value:
        return None

    orig_bounds = glyph_bounds(glyph_set, glyph_name)
    poly = contours_to_polygon(flatten_recording(pen.value, curve_steps))
    if poly is None or poly.is_empty:
        return None

    thinned = poly.buffer(-inset_units, join_style=2, mitre_limit=2.0)
    if thinned.is_empty:
        return None

    thinned = thinned.simplify(max(inset_units * 0.15, 1.5), preserve_topology=True)

    if orig_bounds is not None:
        new_bounds = thinned.bounds
        dx = orig_bounds[0] - new_bounds[0]
        if abs(dx) > 0.01:
            thinned = affinity.translate(thinned, xoff=dx, yoff=0)

    out_pen = TTGlyphPen(None)
    if isinstance(thinned, MultiPolygon):
        for part in thinned.geoms:
            polygon_to_pen(part, out_pen)
    else:
        polygon_to_pen(thinned, out_pen)

    return out_pen.glyph()


def update_names(font: TTFont, family: str, style: str) -> None:
    name = font["name"]
    strings = {
        1: family,
        2: style,
        3: f"{family} {style} 1.002",
        4: f"{family} {style}",
        5: "Version 1.002",
        6: family,
        16: family,
        17: style,
    }
    for name_id, text in strings.items():
        name.setName(text, name_id, 3, 1, 0x409)
    name.setName(
        "Derived from Pants on Fire Narrow for Pants on Fire: Find the Liar.",
        13,
        3,
        1,
        0x409,
    )


def build(source: Path, dest: Path, inset_units: float, curve_steps: int) -> None:
    source_font = TTFont(source)
    source_hmtx = source_font["hmtx"].metrics
    font = TTFont(source)
    glyph_set = font.getGlyphSet()
    glyf = font["glyf"]
    hmtx = font["hmtx"]

    for glyph_name in font.getGlyphOrder():
        if glyph_name in (".notdef", ".null"):
            continue
        new_glyph = thin_glyph(glyph_set, glyph_name, inset_units, curve_steps)
        if new_glyph is None:
            continue
        glyf[glyph_name] = new_glyph
        if glyph_name in source_hmtx:
            hmtx[glyph_name] = source_hmtx[glyph_name]

    update_names(font, "PoF Display", "Regular")
    font["OS/2"].usWeightClass = 375
    dest.parent.mkdir(parents=True, exist_ok=True)
    font.save(dest)
    print(f"Wrote {dest} (inset={inset_units} units)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("public/assets/fonts/pants-on-fire/PantsOnFireNarrow-Regular.ttf"),
    )
    parser.add_argument(
        "--dest",
        type=Path,
        default=Path(
            "public/assets/fonts/pants-on-fire/derived/PoFDisplay-Narrow-Regular.ttf"
        ),
    )
    parser.add_argument(
        "--inset",
        type=float,
        default=11.0,
        help="Inward offset in font units (~9%% stroke reduction at UPM 1000)",
    )
    parser.add_argument("--curve-steps", type=int, default=12)
    args = parser.parse_args()
    build(args.source, args.dest, args.inset, args.curve_steps)


if __name__ == "__main__":
    main()
