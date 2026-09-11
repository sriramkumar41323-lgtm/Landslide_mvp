"""
Data Preprocessing Pipeline: Builds the canonical training dataset for the AI landslide model.
Combines historical positive landslide events with synthesized realistic negative (safe) samples,
calculating 3-day antecedent precipitation, anomalies, terrain topography, and soil saturation proxy.
Saves to /data_pipeline/output/training_dataset.csv.
"""

import os
import sys
import logging
import random
from datetime import datetime, timedelta
import pandas as pd

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from weather_service import fetch_antecedent_rainfall
from terrain import extract_terrain_from_dem

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("build_dataset")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORICAL_CSV_PATH = os.path.join(BASE_DIR, "data", "historical_events.csv")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
OUTPUT_CSV_PATH = os.path.join(OUTPUT_DIR, "training_dataset.csv")

# Safe dry / low-rainfall periods for generating negative samples across same/nearby locations
SAFE_CALENDAR_WINDOWS = [
    ("2021-12-15", "2022-01-20"),
    ("2022-02-10", "2022-03-05"),
    ("2022-11-12", "2022-12-25"),
    ("2023-01-08", "2023-02-18"),
    ("2023-11-20", "2023-12-30"),
    ("2024-01-15", "2024-02-28"),
    ("2024-04-05", "2024-04-18"), # Dry pre-monsoon break
]

# Known stable low-hazard plains/valley locations in NER for non-landslide samples
SAFE_NER_SITES = [
    ("Guwahati Valley Brahmaputra Basin", 26.1445, 91.7362, 55.0, 4.2),
    ("Silchar Barak Valley Plains", 24.8333, 92.7789, 25.0, 3.5),
    ("Tezpur North Bank Plateau", 26.6338, 92.7926, 48.0, 5.0),
    ("Jorhat Alluvial Basin", 26.7509, 94.2037, 87.0, 2.8),
    ("Agartala Low Undulating Terraces", 23.8315, 91.2868, 18.0, 6.5),
]


def generate_negative_samples_for_event(
    event_row: pd.Series, 
    num_samples: int = 4
) -> list:
    """
    Generates 4-5 negative samples for a positive landslide event:
    - Same or nearby location (~10-20km) on dry or non-event dates
    - OR same date window at a known geomorphologically stable site
    """
    negatives = []
    base_lat = float(event_row["latitude"])
    base_lon = float(event_row["longitude"])
    base_loc = str(event_row["location_name"])
    
    # 1. Nearby location with dry-season date (low rainfall, similar mountain terrain)
    for i in range(num_samples - 1):
        # Shift coordinates slightly (within ~15 km: ~0.08 - 0.14 degrees)
        lat_jitter = random.uniform(-0.10, 0.10)
        lon_jitter = random.uniform(-0.10, 0.10)
        sample_lat = round(base_lat + lat_jitter, 4)
        sample_lon = round(base_lon + lon_jitter, 4)
        
        # Pick a safe dry date
        win_start, win_end = random.choice(SAFE_CALENDAR_WINDOWS)
        d_start = datetime.strptime(win_start, "%Y-%m-%d")
        d_end = datetime.strptime(win_end, "%Y-%m-%d")
        random_days = random.randint(0, (d_end - d_start).days)
        sample_date = (d_start + timedelta(days=random_days)).strftime("%Y-%m-%d")
        
        negatives.append({
            "date": sample_date,
            "location_name": f"{base_loc} (Safe Baseline Sector {i+1})",
            "latitude": sample_lat,
            "longitude": sample_lon,
            "landslide_occurred": 0,
            "sample_type": "nearby_dry_date"
        })
        
    # 2. Stable low-hazard topography site on event date or nearby date
    safe_site = random.choice(SAFE_NER_SITES)
    negatives.append({
        "date": str(event_row["date"]).strip()[:10],
        "location_name": safe_site[0],
        "latitude": safe_site[1],
        "longitude": safe_site[2],
        "landslide_occurred": 0,
        "sample_type": "stable_site_same_date"
    })
    
    return negatives


def build_complete_dataset():
    """
    Executes the end-to-end dataset creation pipeline and exports training_dataset.csv.
    """
    logger.info("Initializing NER Landslide Dataset Builder...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    if not os.path.exists(HISTORICAL_CSV_PATH):
        raise FileNotFoundError(f"Missing historical events seed file at {HISTORICAL_CSV_PATH}")
        
    df_events = pd.read_csv(HISTORICAL_CSV_PATH)
    logger.info(f"Loaded {len(df_events)} positive historical events.")
    
    records = []
    
    # Process Positive Samples
    logger.info("Processing Positive Landslide Events (landslide_occurred = 1)...")
    for idx, row in df_events.iterrows():
        lat = float(row["latitude"])
        lon = float(row["longitude"])
        date_str = str(row["date"]).strip()[:10]
        loc_name = str(row["location_name"])
        
        # Extract terrain
        terrain = extract_terrain_from_dem(lat, lon)
        
        # Fetch antecedent weather
        weather = fetch_antecedent_rainfall(lat, lon, date_str, terrain.get("elevation"))
        
        record = {
            "date": date_str,
            "location_name": loc_name,
            "latitude": lat,
            "longitude": lon,
            "day1_rainfall": weather["day1_rainfall"],
            "day2_rainfall": weather["day2_rainfall"],
            "day3_rainfall": weather["day3_rainfall"],
            "cumulative_3day_rainfall": weather["cumulative_3day_rainfall"],
            "rainfall_anomaly": weather["rainfall_anomaly"],
            "elevation": terrain["elevation"],
            "slope": terrain["slope"],
            "aspect": terrain["aspect"],
            "soil_moisture_estimate": weather["soil_moisture_estimate"],
            "temperature": weather.get("temperature", 24.0),
            "landslide_occurred": 1
        }
        records.append(record)
        
        # Generate Negative Samples (Ratio ~ 1:4.5)
        neg_samples = generate_negative_samples_for_event(row, num_samples=4)
        for neg in neg_samples:
            n_lat = neg["latitude"]
            n_lon = neg["longitude"]
            n_date = neg["date"]
            n_loc = neg["location_name"]
            
            n_terrain = extract_terrain_from_dem(n_lat, n_lon)
            n_weather = fetch_antecedent_rainfall(n_lat, n_lon, n_date, n_terrain.get("elevation"))
            
            neg_record = {
                "date": n_date,
                "location_name": n_loc,
                "latitude": n_lat,
                "longitude": n_lon,
                "day1_rainfall": n_weather["day1_rainfall"],
                "day2_rainfall": n_weather["day2_rainfall"],
                "day3_rainfall": n_weather["day3_rainfall"],
                "cumulative_3day_rainfall": n_weather["cumulative_3day_rainfall"],
                "rainfall_anomaly": n_weather["rainfall_anomaly"],
                "elevation": n_terrain["elevation"],
                "slope": n_terrain["slope"],
                "aspect": n_terrain["aspect"],
                "soil_moisture_estimate": n_weather["soil_moisture_estimate"],
                "temperature": n_weather.get("temperature", 24.0),
                "landslide_occurred": 0
            }
            records.append(neg_record)
            
    df_output = pd.DataFrame(records)
    
    # Sort chronologically by date
    df_output["date_dt"] = pd.to_datetime(df_output["date"])
    df_output = df_output.sort_values(by=["date_dt"]).drop(columns=["date_dt"]).reset_index(drop=True)
    
    # Save CSV
    df_output.to_csv(OUTPUT_CSV_PATH, index=False)
    logger.info(f"Successfully generated canonical dataset: {OUTPUT_CSV_PATH}")
    
    # Print Dataset Summary
    pos_count = (df_output["landslide_occurred"] == 1).sum()
    neg_count = (df_output["landslide_occurred"] == 0).sum()
    total = len(df_output)
    logger.info("================ DATASET SUMMARY ================")
    logger.info(f"Total Records: {total}")
    logger.info(f"Positive Samples (Landslide=1): {pos_count} ({pos_count/total*100:.1f}%)")
    logger.info(f"Negative Samples (Landslide=0): {neg_count} ({neg_count/total*100:.1f}%)")
    logger.info(f"Positive-to-Negative Ratio: 1:{neg_count/pos_count:.1f}")
    logger.info(f"Date Range: {df_output['date'].min()} to {df_output['date'].max()}")
    logger.info("=================================================")
    
    return df_output


if __name__ == "__main__":
    build_complete_dataset()
