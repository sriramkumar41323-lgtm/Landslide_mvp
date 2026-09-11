# SRTM Digital Elevation Model (DEM) for North Eastern Region (NER) India

This folder contains Digital Elevation Model GeoTIFF files used by `data_pipeline/terrain.py` to extract elevation (m), slope (degrees), and aspect (degrees) using `rasterio`.

## Expected Default File
- **Target Path**: `data_pipeline/dem/ner_srtm.tif`
- **Supported Tiled SRTM GeoTIFFs**: e.g., `n24_e093_1arc_v3.tif` (Manipur/Noney), `n25_e091_1arc_v3.tif` (Meghalaya/Khasi Hills).

## Where to Download Real SRTM DEM GeoTIFFs
1. **ISRO Bhuvan (National Open Digital Elevation Model)**:
   - URL: https://bhuvan-app3.nrsc.gov.in/data/download/index.php
   - Select: "Open Series Maps" -> "CartoDEM 30m" or "SRTM 1 Arc-Second (~30m)".
   - Select North Eastern India bounding coordinates (Lat: 22°N - 29°N, Lon: 88°E - 97.5°E).

2. **USGS EarthExplorer**:
   - URL: https://earthexplorer.usgs.gov/
   - Under Data Sets -> Digital Elevation -> SRTM -> SRTM 1 Arc-Second Global.
   - Download `.tif` files and save as `ner_srtm.tif` or individual 1x1 degree tiles in this directory (`/data_pipeline/dem/`).

## Fallback Behavior
If `ner_srtm.tif` or a matching tile is not found at runtime:
- The system safely catches the missing file, logs a warning:
  `DEM file not found at '...ner_srtm.tif'. Using calibrated NER synthetic terrain model.`
- Uses a regional geomorphological synthetic topography model calibrated for the mountain belts of Manipur, Mizoram, Meghalaya, Assam, Nagaland, Arunachal Pradesh, and Sikkim.
- The pipeline never crashes.
