# Test Data Files

This directory contains test data for the catalogue and footprint import feature.

## Files

### Catalogues

- **catalogue_test.csv** — Catalogue of bright stars in CSV format
  - Columns: `name`, `ra`, `dec`, `magnitude`, `size`
  - 10 bright stars with realistic coordinates and magnitudes

- **catalogue_test.json** — Same catalogue in JSON format
  - Array of objects with `name`, `ra`, `dec`, `magnitude`, `size`

### Footprints

- **footprints_test.csv** — Footprint set of Messier objects in CSV format
  - Columns: `name`, `ra`, `dec`, `stcs`
  - 5 Messier objects (galaxies and nebulae) with STCS polygon boundaries

- **footprints_test.json** — Same footprint set in JSON format
  - Array of objects with `name`, `ra`, `dec`, `stcs`

## How to Use

1. Open the AstroViewer dev UI in your browser
2. Scroll to the **"Import catalogue / footprint"** section
3. Click on the file input and select one of these test files
4. Choose the import type (Catalogue or Footprint set)
5. Verify the column mappings are correct (or adjust if needed)
6. Click **"Import"** to load the data
7. The imported catalogue or footprint set will appear in the respective manager table

## Data Format Notes

### Catalogues
- `ra`, `dec` are expected in decimal degrees (0–360 for RA, −90–+90 for Dec)
- `magnitude` is optional; can represent brightness or other numeric property
- `size` is optional; represents angular size in degrees

### Footprints
- `ra`, `dec` are the centre coordinates
- `stcs` (STC-S format): polygons are defined as `POLYGON lon1 lat1 lon2 lat2 ... lon1 lat1`
  - Coordinates are space-separated (no commas)
  - First and last point should be the same to close the polygon
  - Example: `POLYGON 250.3 36.3 250.5 36.3 250.5 36.6 250.3 36.6 250.3 36.3`

## Coordinates Reference

- **Sirius** (α Canis Majoris): RA 6h 45m (101.29°), Dec −16° 43' (−16.72°)
- **Canopus** (α Carinae): RA 6h 24m (95.99°), Dec −52° 42' (−52.70°)
- **Polaris** (α Ursae Minoris): RA 2h 32m (37.95°), Dec +89° 16' (89.26°)
- **M13** (Hercules Globular Cluster): RA 16h 41m (250.42°), Dec +36° 28' (36.46°)
- **M31** (Andromeda Galaxy): RA 0h 42m (10.68°), Dec +41° 16' (41.27°)
