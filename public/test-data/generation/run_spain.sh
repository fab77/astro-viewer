#!/bin/bash

#curl -L -o limits_IT_regions.geojson \
#https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson

#python geojson_regions_to_stcs_csv.py limits_IT_regions.geojson italy_regions_footprints_stcs.csv \
#  --min-points 100 --max-points 800


curl -L -o spain_regions.geojson \
https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/spain-communities.geojson

# python geojson_regions_to_stcs_csv_precise.py \

python geojson_regions_to_stcs_compound.py \
  spain_regions.geojson \
  spain_regions_footprints_stcs.csv \
  --min-points 100 \
  --max-points 800