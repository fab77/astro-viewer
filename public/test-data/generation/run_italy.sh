#!/bin/bash

#curl -L -o limits_IT_regions.geojson \
#https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson

#python geojson_regions_to_stcs_csv.py limits_IT_regions.geojson italy_regions_footprints_stcs.csv \
#  --min-points 100 --max-points 800


curl -L -o limits_IT_regions.geojson \
https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson

python geojson_regions_to_stcs_csv_precise.py \
  limits_IT_regions.geojson \
  italy_regions_footprints_stcs.csv \
  --min-points 100 \
  --max-points 800
