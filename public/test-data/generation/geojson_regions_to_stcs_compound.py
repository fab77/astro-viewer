#!/usr/bin/env python3
"""
Convert Italian regional GeoJSON boundaries to a CSV footprint file using STC-S/STCS polygons.

Goal:
- one CSV row per region
- one STCS field containing multiple POLYGON ICRS definitions when a region has islands / multipart geometry
- only outer boundaries are exported
- holes/interior rings are intentionally ignored, because the target viewer treats multiple polygons
  in one STCS field as a single compound footprint
- each exported polygon ring is kept as close as possible to the source geometry, with optional
  simplification only when a ring exceeds --max-points

Recommended source:
  https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson

Example:
  python geojson_regions_to_stcs_compound.py limits_IT_regions.geojson italy_regions_footprints_stcs.csv \
    --min-points 100 --max-points 800
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Any, Iterable, List, Sequence, Tuple

Point = Tuple[float, float]
Ring = List[Point]


def point_line_distance(p: Point, a: Point, b: Point) -> float:
    """Approximate planar distance in lon/lat degrees; sufficient for simplification ranking."""
    px, py = p
    ax, ay = a
    bx, by = b

    dx = bx - ax
    dy = by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)

    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    x = ax + t * dx
    y = ay + t * dy
    return math.hypot(px - x, py - y)


def rdp(points: Sequence[Point], epsilon: float) -> Ring:
    """Ramer-Douglas-Peucker simplification for an open line."""
    if len(points) <= 2:
        return list(points)

    start = points[0]
    end = points[-1]

    max_dist = -1.0
    index = -1
    for i in range(1, len(points) - 1):
        d = point_line_distance(points[i], start, end)
        if d > max_dist:
            max_dist = d
            index = i

    if max_dist > epsilon:
        left = rdp(points[: index + 1], epsilon)
        right = rdp(points[index:], epsilon)
        return left[:-1] + right

    return [start, end]


def drop_duplicate_closing_point(ring: Ring) -> Ring:
    if len(ring) > 1 and ring[0] == ring[-1]:
        return ring[:-1]
    return ring


def close_ring(ring: Ring) -> Ring:
    if ring and ring[0] != ring[-1]:
        return ring + [ring[0]]
    return ring


def ring_area(ring: Sequence[Point]) -> float:
    """Shoelace area in lon/lat degrees. Used only for sorting parts by size."""
    if len(ring) < 3:
        return 0.0
    pts = close_ring(list(ring))
    s = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        s += x1 * y2 - x2 * y1
    return abs(s) / 2.0


def simplify_to_max_points(ring: Ring, max_points: int) -> Ring:
    """
    Simplify a closed polygon ring to <= max_points vertices, excluding duplicated closing point.

    Uses binary search on RDP epsilon. If simplification cannot hit the target exactly,
    returns the densest version below the threshold.
    """
    ring = drop_duplicate_closing_point(ring)

    if len(ring) <= max_points:
        return ring

    # RDP works on open lines; duplicate first point at end during simplification
    # to preserve global closure shape.
    closed = close_ring(ring)

    lo = 0.0
    hi = 5.0  # degrees; safely large for regional boundaries
    best = ring

    for _ in range(40):
        mid = (lo + hi) / 2.0
        simplified = drop_duplicate_closing_point(rdp(closed, mid))

        if len(simplified) > max_points:
            lo = mid
        else:
            best = simplified
            hi = mid

    # Pathological fallback: keep evenly spaced points, but prefer RDP result when possible.
    if len(best) > max_points:
        step = len(ring) / max_points
        best = [ring[int(i * step)] for i in range(max_points)]

    return best


def densify_to_min_points(ring: Ring, min_points: int) -> Ring:
    """
    Add interpolated points along edges until the ring has at least min_points vertices.

    This does not add real coastline detail; it only avoids too-short test polygons.
    For precise footprints, prefer a detailed source geometry instead.
    """
    ring = drop_duplicate_closing_point(ring)

    if len(ring) >= min_points or len(ring) < 2:
        return ring

    needed = min_points - len(ring)
    edges = []
    for i, a in enumerate(ring):
        b = ring[(i + 1) % len(ring)]
        length = math.hypot(b[0] - a[0], b[1] - a[1])
        edges.append((length, i, a, b))

    total = sum(e[0] for e in edges)
    if total == 0:
        return ring

    inserts_per_edge = [0] * len(edges)

    # First distribute proportionally by edge length.
    assigned = 0
    for length, i, _, _ in edges:
        n = int((length / total) * needed)
        inserts_per_edge[i] = n
        assigned += n

    # Then assign leftovers to longest edges.
    for _, i, _, _ in sorted(edges, reverse=True)[: needed - assigned]:
        inserts_per_edge[i] += 1

    out: Ring = []
    for i, a in enumerate(ring):
        b = ring[(i + 1) % len(ring)]
        out.append(a)
        n = inserts_per_edge[i]
        for j in range(1, n + 1):
            t = j / (n + 1)
            out.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))

    return out


def normalise_ring(ring_coords: Sequence[Sequence[float]], min_points: int, max_points: int) -> Ring:
    ring: Ring = [(float(lon), float(lat)) for lon, lat, *_ in ring_coords]
    ring = drop_duplicate_closing_point(ring)

    if len(ring) > max_points:
        ring = simplify_to_max_points(ring, max_points)

    if len(ring) < min_points:
        ring = densify_to_min_points(ring, min_points)

    return ring


def geometry_outer_rings(geometry: dict[str, Any]) -> list[Ring]:
    """
    Extract only outer rings from Polygon or MultiPolygon geometry.

    GeoJSON structure:
    - Polygon: coordinates = [outer, hole1, hole2, ...]
    - MultiPolygon: coordinates = [[outer, holes...], [outer, holes...], ...]
    """
    gtype = geometry.get("type")
    coords = geometry.get("coordinates")

    if gtype == "Polygon":
        if not coords:
            return []
        return [coords[0]]

    if gtype == "MultiPolygon":
        rings = []
        for polygon in coords or []:
            if polygon:
                rings.append(polygon[0])
        return rings

    return []


def pick_property(props: dict[str, Any], candidates: Sequence[str], fallback: str = "") -> str:
    for key in candidates:
        value = props.get(key)
        if value not in (None, ""):
            return str(value)
    return fallback


def ring_to_stcs_polygon(ring: Ring, precision: int) -> str:
    # STCS POLYGON does not need the closing point repeated.
    coords = []
    for lon, lat in ring:
        coords.append(f"{lon:.{precision}f} {lat:.{precision}f}")
    return "POLYGON ICRS " + " ".join(coords)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_geojson", type=Path)
    parser.add_argument("output_csv", type=Path)
    parser.add_argument("--min-points", type=int, default=100)
    parser.add_argument("--max-points", type=int, default=800)
    parser.add_argument("--precision", type=int, default=6)
    parser.add_argument(
        "--stcs-separator",
        default=" ",
        help="Separator between multiple POLYGON definitions in the same STCS field. Default: single space.",
    )
    parser.add_argument(
        "--id-fields",
        default="reg_istat_code,reg_istat_code_num,code,istat,ID, id",
        help="Comma-separated candidate property names for region id.",
    )
    parser.add_argument(
        "--name-fields",
        default="reg_name,name,nome,denominazione,NAME",
        help="Comma-separated candidate property names for region name.",
    )
    args = parser.parse_args()

    if args.min_points < 3:
        raise ValueError("--min-points must be >= 3")
    if args.max_points < args.min_points:
        raise ValueError("--max-points must be >= --min-points")

    data = json.loads(args.input_geojson.read_text(encoding="utf-8"))
    features = data.get("features", [])

    id_fields = [x.strip() for x in args.id_fields.split(",") if x.strip()]
    name_fields = [x.strip() for x in args.name_fields.split(",") if x.strip()]

    rows = []
    for idx, feature in enumerate(features, start=1):
        props = feature.get("properties", {}) or {}
        geometry = feature.get("geometry", {}) or {}

        region_id = pick_property(props, id_fields, fallback=f"region_{idx:02d}")
        region_name = pick_property(props, name_fields, fallback=region_id)

        raw_rings = geometry_outer_rings(geometry)
        rings: list[Ring] = []
        for raw_ring in raw_rings:
            ring = normalise_ring(raw_ring, args.min_points, args.max_points)
            if len(ring) >= 3:
                rings.append(ring)

        # Largest mainland/island parts first, useful for debug and stable diffs.
        rings.sort(key=ring_area, reverse=True)

        polygons = [ring_to_stcs_polygon(r, args.precision) for r in rings]
        stcs = args.stcs_separator.join(polygons)

        rows.append({
            "id": region_id,
            "name": region_name,
            "stcs": stcs,
            "polygon_count": len(polygons),
            "point_counts": "|".join(str(len(r)) for r in rings),
        })

    with args.output_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["id", "name", "stcs", "polygon_count", "point_counts"],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} region rows to {args.output_csv}")


if __name__ == "__main__":
    main()
