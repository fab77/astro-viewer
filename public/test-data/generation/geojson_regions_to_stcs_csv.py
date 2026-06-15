#!/usr/bin/env python3
"""
Convert Italian regional boundaries from GeoJSON to a footprint_test.csv-compatible
CSV where polygon coordinates are encoded as STC-S POLYGON ICRS lon lat ...

Input source recommended:
  https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson

Usage:
  python geojson_regions_to_stcs_csv.py limits_IT_regions.geojson italy_regions_footprints_stcs.csv \
    --min-points 100 --max-points 800
"""
import argparse
import csv
import json
from pathlib import Path
from typing import Iterable, List, Tuple

Point = Tuple[float, float]

def ring_area(ring: List[Point]) -> float:
    if len(ring) < 3:
        return 0.0
    s = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        s += x1 * y2 - x2 * y1
    return abs(s) / 2.0


def extract_outer_rings(geometry: dict) -> Iterable[List[Point]]:
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if gtype == "Polygon":
        if coords:
            yield [(float(x), float(y)) for x, y in coords[0]]
    elif gtype == "MultiPolygon":
        for poly in coords:
            if poly:
                yield [(float(x), float(y)) for x, y in poly[0]]
    else:
        raise ValueError(f"Unsupported geometry type: {gtype}")


def largest_rings_only(rings: List[List[Point]], min_area_ratio: float = 0.002) -> List[List[Point]]:
    """Keep main mainland/island rings, drop tiny holes/islets if too small for test data."""
    if not rings:
        return []
    areas = [ring_area(r) for r in rings]
    max_area = max(areas)
    return [r for r, a in zip(rings, areas) if a >= max_area * min_area_ratio]


def remove_closing_duplicate(ring: List[Point]) -> List[Point]:
    if len(ring) > 1 and ring[0] == ring[-1]:
        return ring[:-1]
    return ring


def resample_ring(ring: List[Point], target: int) -> List[Point]:
    """Uniformly resample ring along polyline length to target vertices."""
    ring = remove_closing_duplicate(ring)
    if len(ring) <= 2:
        return ring
    closed = ring + [ring[0]]
    segs = []
    total = 0.0
    for p1, p2 in zip(closed[:-1], closed[1:]):
        dx, dy = p2[0] - p1[0], p2[1] - p1[1]
        length = (dx * dx + dy * dy) ** 0.5
        segs.append((p1, p2, length))
        total += length
    if total == 0:
        return ring[:target]
    result = []
    step = total / target
    seg_i = 0
    acc_before = 0.0
    for i in range(target):
        d = i * step
        while seg_i < len(segs) - 1 and acc_before + segs[seg_i][2] < d:
            acc_before += segs[seg_i][2]
            seg_i += 1
        p1, p2, length = segs[seg_i]
        t = 0.0 if length == 0 else (d - acc_before) / length
        result.append((p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])))
    return result


def fit_points(ring: List[Point], min_points: int, max_points: int) -> List[Point]:
    ring = remove_closing_duplicate(ring)
    n = len(ring)
    if n < min_points:
        return resample_ring(ring, min_points)
    if n > max_points:
        return resample_ring(ring, max_points)
    return ring


def stcs_polygon(ring: List[Point], precision: int) -> str:
    parts = []
    for lon, lat in ring:
        parts.append(f"{lon:.{precision}f}")
        parts.append(f"{lat:.{precision}f}")
    return "POLYGON ICRS " + " ".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_geojson")
    parser.add_argument("output_csv")
    parser.add_argument("--min-points", type=int, default=100)
    parser.add_argument("--max-points", type=int, default=800)
    parser.add_argument("--precision", type=int, default=6)
    args = parser.parse_args()

    data = json.loads(Path(args.input_geojson).read_text(encoding="utf-8"))
    rows = []
    for feature in data["features"]:
        props = feature.get("properties", {})
        region_name = props.get("reg_name") or props.get("name") or props.get("den_reg") or "Unknown"
        region_code = props.get("reg_istat_code") or props.get("reg_istat_code_num") or props.get("cod_reg") or region_name
        rings = largest_rings_only(list(extract_outer_rings(feature["geometry"])))
        for part_index, ring in enumerate(rings, start=1):
            fitted = fit_points(ring, args.min_points, args.max_points)
            suffix = "" if len(rings) == 1 else f"-{part_index}"
            rows.append({
                "id": f"IT-{region_code}{suffix}",
                "name": region_name if len(rings) == 1 else f"{region_name} part {part_index}",
                "stcs": stcs_polygon(fitted, args.precision),
                "points": len(fitted),
                "source": "openpolis/geojson-italy limits_IT_regions.geojson from ISTAT boundaries, WGS84",
            })

    with Path(args.output_csv).open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "stcs", "points", "source"])
        writer.writeheader()
        writer.writerows(rows)

if __name__ == "__main__":
    main()
