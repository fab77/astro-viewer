#!/usr/bin/env python3
"""
Convert Italian regional GeoJSON boundaries to a footprint_test.csv-compatible
CSV with STC-S/STCS POLYGON ICRS footprints.

Key points:
- Uses the original GeoJSON rings; it does NOT stitch MultiPolygon parts together.
- Writes one CSV row per exterior ring / island / mainland part.
- Uses topology-preserving Douglas-Peucker simplification only when a ring has
  more than --max-points vertices.
- Optionally drops tiny islands using --min-area-ratio. Default is 0: keep all.
- Does not convert polygon holes, because basic STC-S POLYGON has no portable
  MultiPolygon/hole representation. For administrative region footprints this is
  normally acceptable for test overlays, but not for exact GIS analysis.

Recommended source:
  https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson

Example:
  python geojson_regions_to_stcs_csv_precise.py limits_IT_regions.geojson italy_regions_footprints_stcs.csv \
    --min-points 100 --max-points 800 --precision 6
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Any, Iterable, List, Sequence, Tuple

from shapely.geometry import LinearRing, Polygon

Point = Tuple[float, float]


def remove_closing_duplicate(ring: Sequence[Point]) -> List[Point]:
    pts = [(float(x), float(y)) for x, y in ring]
    if len(pts) > 1 and pts[0] == pts[-1]:
        return pts[:-1]
    return pts


def close_ring(ring: Sequence[Point]) -> List[Point]:
    pts = list(ring)
    if pts and pts[0] != pts[-1]:
        pts.append(pts[0])
    return pts


def signed_area(ring: Sequence[Point]) -> float:
    pts = remove_closing_duplicate(ring)
    if len(pts) < 3:
        return 0.0
    total = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        total += x1 * y2 - x2 * y1
    return total / 2.0


def ring_area_abs(ring: Sequence[Point]) -> float:
    return abs(signed_area(ring))


def exterior_rings_from_geometry(geometry: dict[str, Any]) -> Iterable[List[Point]]:
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])

    if gtype == "Polygon":
        if coords:
            yield remove_closing_duplicate(coords[0])
        return

    if gtype == "MultiPolygon":
        for poly in coords:
            if poly:
                yield remove_closing_duplicate(poly[0])
        return

    raise ValueError(f"Unsupported geometry type: {gtype}")


def densify_ring(ring: Sequence[Point], target_points: int) -> List[Point]:
    """Add points along existing edges. This does not invent new coastline detail."""
    pts = remove_closing_duplicate(ring)
    if len(pts) >= target_points or len(pts) < 2:
        return pts

    closed = pts + [pts[0]]
    seg_lengths: List[float] = []
    total = 0.0
    for a, b in zip(closed[:-1], closed[1:]):
        length = math.hypot(b[0] - a[0], b[1] - a[1])
        seg_lengths.append(length)
        total += length

    if total == 0:
        return pts

    # Keep original vertices and add interpolated points proportionally per segment.
    extra_needed = target_points - len(pts)
    raw_extra = [(length / total) * extra_needed for length in seg_lengths]
    extras = [int(math.floor(x)) for x in raw_extra]
    remainder = extra_needed - sum(extras)
    order = sorted(range(len(raw_extra)), key=lambda i: raw_extra[i] - extras[i], reverse=True)
    for i in order[:remainder]:
        extras[i] += 1

    out: List[Point] = []
    for i, (a, b) in enumerate(zip(closed[:-1], closed[1:])):
        out.append(a)
        n_extra = extras[i]
        for j in range(1, n_extra + 1):
            t = j / (n_extra + 1)
            out.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))

    return out[:target_points]


def simplify_to_max_points(ring: Sequence[Point], max_points: int) -> List[Point]:
    """Simplify preserving topology, aiming for <= max_points vertices."""
    pts = remove_closing_duplicate(ring)
    if len(pts) <= max_points:
        return pts

    # Shapely polygons need closed rings.
    poly = Polygon(close_ring(pts))
    if not poly.is_valid:
        # buffer(0) often fixes small self-intersections in input data.
        poly = poly.buffer(0)

    if poly.is_empty:
        return pts[:max_points]

    # If buffer(0) produced a MultiPolygon, keep the largest component for this ring.
    if poly.geom_type == "MultiPolygon":
        poly = max(poly.geoms, key=lambda g: g.area)

    # Binary search tolerance in coordinate degrees.
    low, high = 0.0, 0.2
    best = pts
    for _ in range(40):
        mid = (low + high) / 2.0
        simp = poly.simplify(mid, preserve_topology=True)
        if simp.is_empty:
            high = mid
            continue
        if simp.geom_type == "MultiPolygon":
            simp = max(simp.geoms, key=lambda g: g.area)
        candidate = remove_closing_duplicate(list(simp.exterior.coords))
        if len(candidate) > max_points:
            low = mid
        else:
            best = candidate
            high = mid

    # Safety fallback: preserve order by striding if simplification could not converge.
    if len(best) > max_points:
        step = len(best) / max_points
        best = [best[int(i * step)] for i in range(max_points)]

    return best


def normalise_orientation_ccw(ring: Sequence[Point]) -> List[Point]:
    pts = remove_closing_duplicate(ring)
    # GeoJSON exterior rings are often counter-clockwise, but not guaranteed.
    # For consistency, force CCW in lon/lat plane.
    return pts if signed_area(pts) > 0 else list(reversed(pts))


def stcs_polygon(ring: Sequence[Point], precision: int) -> str:
    pts = remove_closing_duplicate(ring)
    values: List[str] = []
    for lon, lat in pts:
        values.append(f"{lon:.{precision}f}")
        values.append(f"{lat:.{precision}f}")
    return "POLYGON ICRS " + " ".join(values)


def get_property(props: dict[str, Any], names: Sequence[str], fallback: str) -> str:
    for name in names:
        value = props.get(name)
        if value not in (None, ""):
            return str(value)
    return fallback


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_geojson")
    parser.add_argument("output_csv")
    parser.add_argument("--min-points", type=int, default=100)
    parser.add_argument("--max-points", type=int, default=800)
    parser.add_argument("--precision", type=int, default=6)
    parser.add_argument(
        "--min-area-ratio",
        type=float,
        default=0.0,
        help="Drop tiny polygon parts smaller than this ratio of the largest part in the same region. Default 0 keeps all parts.",
    )
    parser.add_argument(
        "--schema",
        choices=["simple", "debug"],
        default="simple",
        help="simple: id,name,stcs. debug: adds points,part,area,source columns.",
    )
    args = parser.parse_args()

    if args.min_points > args.max_points:
        raise SystemExit("--min-points cannot be greater than --max-points")

    data = json.loads(Path(args.input_geojson).read_text(encoding="utf-8"))
    rows: List[dict[str, Any]] = []

    for feature in data.get("features", []):
        props = feature.get("properties", {})
        name = get_property(props, ["reg_name", "name", "den_reg", "DEN_REG"], "Unknown")
        code = get_property(props, ["reg_istat_code", "reg_istat_code_num", "cod_reg", "COD_REG"], name)

        raw_rings = [r for r in exterior_rings_from_geometry(feature["geometry"]) if len(r) >= 3]
        if not raw_rings:
            continue

        areas = [ring_area_abs(r) for r in raw_rings]
        max_area = max(areas)

        kept: List[Tuple[int, List[Point], float]] = []
        for index, (ring, area) in enumerate(zip(raw_rings, areas), start=1):
            if args.min_area_ratio > 0 and area < max_area * args.min_area_ratio:
                continue
            kept.append((index, ring, area))

        for output_part_index, (original_part_index, ring, area) in enumerate(kept, start=1):
            processed = normalise_orientation_ccw(ring)
            processed = simplify_to_max_points(processed, args.max_points)
            processed = densify_ring(processed, args.min_points)
            processed = normalise_orientation_ccw(processed)

            suffix = "" if len(kept) == 1 else f"-{output_part_index:02d}"
            row = {
                "id": f"IT-{code}{suffix}",
                "name": name if len(kept) == 1 else f"{name} part {output_part_index}",
                "stcs": stcs_polygon(processed, args.precision),
            }
            if args.schema == "debug":
                row.update(
                    {
                        "points": len(processed),
                        "part": original_part_index,
                        "area": f"{area:.12f}",
                        "source": "openpolis/geojson-italy limits_IT_regions.geojson, WGS84, derived from ISTAT boundaries",
                    }
                )
            rows.append(row)

    fieldnames = ["id", "name", "stcs"] if args.schema == "simple" else ["id", "name", "stcs", "points", "part", "area", "source"]
    with Path(args.output_csv).open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} STCS polygon rows to {args.output_csv}")


if __name__ == "__main__":
    main()
