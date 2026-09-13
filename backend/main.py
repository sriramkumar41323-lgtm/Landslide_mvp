"""
FastAPI Bridge Server for BhujanRakshak: AI Landslide Early Warning System.
Loads trained Random Forest model & config, integrates with Supabase,
schedules recurring landslide risk evaluations across NER locations,
dispatches debounced SMS alerts, and exposes REST endpoints for frontend & IoT clients.
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Ensure backend, parent, and data pipeline imports are accessible
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
for path_to_add in [CURRENT_DIR, ROOT_DIR, os.path.join(ROOT_DIR, "data_pipeline")]:
    if path_to_add not in sys.path:
        sys.path.insert(0, path_to_add)

# Load environment variables
load_dotenv(os.path.join(CURRENT_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

from terrain import extract_terrain_from_dem
from weather_service import fetch_antecedent_rainfall
try:
    from alert_service import dispatch_sms_alert, get_all_alerts
except ImportError:
    from backend.alert_service import dispatch_sms_alert, get_all_alerts

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("backend_server")

# Paths
MODEL_PATH = os.path.join(ROOT_DIR, "model_training", "model.joblib")
CONFIG_PATH = os.path.join(ROOT_DIR, "model_training", "config.json")
LOCATIONS_PATH = os.path.join(CURRENT_DIR, "locations.json")

# Global State
ml_model = None
ml_config = {}
monitored_locations = []
supabase_client = None
scheduler = AsyncIOScheduler()

# Local In-Memory Fallback Cache for Location Risk
LOCAL_LOCATION_RISKS: Dict[str, Dict[str, Any]] = {}


# Pydantic Schemas
class SubscribeRequest(BaseModel):
    name: str = Field(..., description="Subscriber name or organization")
    phone: str = Field(..., description="E.164 phone number (e.g. +919876543210)")
    location_name: str = Field(..., description="Target monitored location name")


class TestAlertRequest(BaseModel):
    phone: Optional[str] = None
    location_name: Optional[str] = "Noney (Tupul Railway Corridor)"
    risk_score: Optional[float] = 0.95


class PredictRequest(BaseModel):
    location_name: Optional[str] = "Ad-hoc Testing Coordinate"
    latitude: float = 24.7174
    longitude: float = 93.6331
    day1_rainfall: float = 45.0
    day2_rainfall: float = 38.0
    day3_rainfall: float = 25.0
    cumulative_3day_rainfall: Optional[float] = None
    rainfall_anomaly: Optional[float] = None
    elevation: Optional[float] = None
    slope: Optional[float] = None
    aspect: Optional[float] = None
    soil_moisture_estimate: Optional[float] = None
    temperature: Optional[float] = None


def init_supabase():
    """Initializes Supabase Python client using environment variables."""
    global supabase_client
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_key = os.getenv("SUPABASE_KEY", "").strip()

    if not supabase_url or not supabase_key or supabase_url.startswith("https://your-project-id"):
        logger.warning("Supabase credentials not configured in backend/.env. Running with robust local in-memory store.")
        supabase_client = None
        return

    try:
        from supabase import create_client, Client
        supabase_client = create_client(supabase_url, supabase_key)
        logger.info(f"Supabase Python Client connected successfully to {supabase_url}")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}. Falling back to in-memory store.")
        supabase_client = None


def load_model_and_config():
    """Loads serialised ML model and configuration."""
    global ml_model, ml_config
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                ml_config = json.load(f)
            logger.info(f"Loaded model configuration from {CONFIG_PATH}")
        except Exception as e:
            logger.error(f"Error loading config.json: {e}")

    if os.path.exists(MODEL_PATH):
        try:
            ml_model = joblib.load(MODEL_PATH)
            logger.info(f"Loaded Random Forest model from {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Error loading model.joblib: {e}")
    else:
        logger.warning(f"Model file {MODEL_PATH} not found. Please execute model_training/train_model.py.")


def load_locations():
    """Loads monitored locations from locations.json and initializes local cache."""
    global monitored_locations, LOCAL_LOCATION_RISKS
    if os.path.exists(LOCATIONS_PATH):
        try:
            with open(LOCATIONS_PATH, "r") as f:
                monitored_locations = json.load(f)
            logger.info(f"Loaded {len(monitored_locations)} monitored NER locations from {LOCATIONS_PATH}")
            for loc in monitored_locations:
                if loc["name"] not in LOCAL_LOCATION_RISKS:
                    LOCAL_LOCATION_RISKS[loc["name"]] = {
                        "location_name": loc["name"],
                        "latitude": loc["latitude"],
                        "longitude": loc["longitude"],
                        "risk_score": 0.45,
                        "risk_level": "Medium",
                        "rainfall_3day": 52.0,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
        except Exception as e:
            logger.error(f"Error reading locations.json: {e}")
            monitored_locations = []


def map_score_to_level(score: float) -> str:
    """Maps continuous risk probability [0.0 - 1.0] to Low, Medium, High risk levels."""
    thresholds = ml_config.get("risk_thresholds", {
        "Low": {"min": 0.0, "max": 0.33},
        "Medium": {"min": 0.33, "max": 0.66},
        "High": {"min": 0.66, "max": 1.0}
    })
    if score >= thresholds.get("High", {}).get("min", 0.66):
        return "High"
    if score >= thresholds.get("Medium", {}).get("min", 0.33):
        return "Medium"
    return "Low"


async def run_pipeline_cycle():
    """
    Core Pipeline Cycle:
    Iterates over all monitored locations, extracts terrain and recent antecedent precipitation,
    predicts risk score with ML model, writes to Supabase location_risk,
    and dispatches debounced SMS alerts for High risk conditions.
    """
    logger.info("=== [PIPELINE] Starting Scheduled Landslide Risk Assessment Cycle ===")
    if ml_model is None:
        logger.warning("ML Model not loaded; skipping evaluation cycle.")
        return

    features_list = ml_config.get("features", [
        "day1_rainfall", "day2_rainfall", "day3_rainfall",
        "cumulative_3day_rainfall", "rainfall_anomaly",
        "elevation", "slope", "aspect", "soil_moisture_estimate",
        "temperature"
    ])

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results = []

    for loc in monitored_locations:
        loc_name = loc["name"]
        lat = loc["latitude"]
        lon = loc["longitude"]

        # 1. Retrieve static terrain features
        terrain = extract_terrain_from_dem(lat, lon)

        # 2. Fetch live/recent rainfall via meteostat (with calibrated fallback)
        weather = fetch_antecedent_rainfall(lat, lon, today_str, terrain.get("elevation"))

        # 3. Form input vector
        features_dict = {
            "day1_rainfall": weather["day1_rainfall"],
            "day2_rainfall": weather["day2_rainfall"],
            "day3_rainfall": weather["day3_rainfall"],
            "cumulative_3day_rainfall": weather["cumulative_3day_rainfall"],
            "rainfall_anomaly": weather["rainfall_anomaly"],
            "elevation": terrain["elevation"],
            "slope": terrain["slope"],
            "aspect": terrain["aspect"],
            "soil_moisture_estimate": weather["soil_moisture_estimate"],
            "temperature": weather.get("temperature", 24.0)
        }

        df_input = pd.DataFrame([features_dict])[features_list]

        # 4. Model Prediction
        try:
            risk_score = float(ml_model.predict_proba(df_input)[0, 1])
        except Exception as e:
            logger.error(f"Prediction failed for {loc_name}: {e}")
            risk_score = 0.5

        risk_level = map_score_to_level(risk_score)
        cumulative_3day = weather["cumulative_3day_rainfall"]
        now_iso = datetime.now(timezone.utc).isoformat()

        row_payload = {
            "location_name": loc_name,
            "latitude": lat,
            "longitude": lon,
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "rainfall_3day": cumulative_3day,
            "updated_at": now_iso
        }

        # 5. Write to Supabase location_risk
        if supabase_client:
            try:
                supabase_client.table("location_risk").upsert(row_payload).execute()
            except Exception as e:
                logger.warning(f"Error upserting to Supabase location_risk for {loc_name}: {e}")

        # Local cache
        LOCAL_LOCATION_RISKS[loc_name] = row_payload

        # 6. Check High Risk & Debounce -> Dispatch Alert
        if risk_level == "High":
            dispatch_sms_alert(supabase_client, loc_name, risk_score, risk_level)

        results.append(row_payload)
        logger.info(f"Evaluated [{loc_name}]: Risk Score={risk_score*100:.1f}%, Level={risk_level}, 3-Day Rain={cumulative_3day}mm")

    logger.info(f"=== [PIPELINE] Cycle Completed for {len(results)} Locations ===")
    return results


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: sets up ML model, config, scheduler on startup."""
    init_supabase()
    load_model_and_config()
    load_locations()

    # Pre-seed initial local risks
    for loc in monitored_locations:
        LOCAL_LOCATION_RISKS[loc["name"]] = {
            "location_name": loc["name"],
            "latitude": loc["latitude"],
            "longitude": loc["longitude"],
            "risk_score": 0.45,
            "risk_level": "Medium",
            "rainfall_3day": 52.0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

    # Run initial pipeline check asynchronously
    scheduler.add_job(run_pipeline_cycle, "interval", hours=1, id="ner_hourly_pipeline")
    scheduler.start()
    logger.info("APScheduler initialized: hourly landslide pipeline active.")

    # Execute first pipeline pass in background on startup
    scheduler.add_job(run_pipeline_cycle, "date", run_date=datetime.now(timezone.utc))

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")


app = FastAPI(
    title="BhujanRakshak AI Landslide Early Warning System",
    description="Bridge server for North Eastern Region India Landslide Risk Forecasting & Realtime Alerting.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# REST ENDPOINTS
# =====================================================================

@app.get("/")
def root():
    return {
        "system": "BhujanRakshak AI Landslide Early Warning System",
        "region": "North Eastern Region (NER) India",
        "status": "ONLINE",
        "model_loaded": ml_model is not None,
        "monitored_locations_count": len(monitored_locations),
        "supabase_connected": supabase_client is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/locations")
def get_locations():
    """Returns current risk data for all monitored locations."""
    if not monitored_locations:
        load_locations()

    if supabase_client:
        try:
            res = supabase_client.table("location_risk").select("*").execute()
            if res.data and len(res.data) > 0:
                return {"status": "success", "source": "supabase", "data": res.data}
        except Exception as e:
            logger.warning(f"Failed querying Supabase location_risk: {e}")

    # Fallback to local memory cache
    return {"status": "success", "source": "in_memory_cache", "data": list(LOCAL_LOCATION_RISKS.values())}


@app.get("/alerts")
def get_alerts(limit: int = Query(50, description="Maximum alerts to retrieve")):
    """Returns recent alert history from Supabase or local log."""
    alerts = get_all_alerts(supabase_client, limit=limit)
    return {"status": "success", "count": len(alerts), "alerts": alerts}


@app.post("/subscribe")
def subscribe(payload: SubscribeRequest):
    """Registers a citizen or authority phone number for SMS early warnings."""
    entry = {
        "name": payload.name.strip(),
        "phone": payload.phone.strip(),
        "location_name": payload.location_name.strip(),
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    }

    if supabase_client:
        try:
            res = supabase_client.table("subscribers").insert(entry).execute()
            return {"status": "success", "message": f"Successfully subscribed {payload.phone} to {payload.location_name}", "data": res.data}
        except Exception as e:
            logger.warning(f"Error saving subscriber in Supabase: {e}")

    return {
        "status": "success",
        "message": f"Locally registered subscription for {payload.name} ({payload.phone}) at {payload.location_name}",
        "data": entry
    }


@app.get("/model-metrics")
def get_model_metrics():
    """Returns saved model evaluation metrics and historical backtest result."""
    if not ml_config:
        load_model_and_config()
    return {
        "status": "success",
        "config": ml_config
    }


@app.post("/predict")
def predict_manual(payload: PredictRequest):
    """
    Ad-hoc manual prediction endpoint for testing specific weather & terrain values.
    Returns calculated risk score, risk level, and computed features.
    """
    if ml_model is None:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    # 1. Fill terrain if missing
    if payload.elevation is None or payload.slope is None or payload.aspect is None:
        t = extract_terrain_from_dem(payload.latitude, payload.longitude)
        elev = payload.elevation or t["elevation"]
        slp = payload.slope or t["slope"]
        asp = payload.aspect or t["aspect"]
    else:
        elev = payload.elevation
        slp = payload.slope
        asp = payload.aspect

    # 2. Cumulative rain & anomaly calculation
    c_rain = payload.cumulative_3day_rainfall
    if c_rain is None:
        c_rain = round(payload.day1_rainfall + payload.day2_rainfall + payload.day3_rainfall, 1)

    anomaly = payload.rainfall_anomaly
    if anomaly is None:
        # Default normal is ~30mm for 3 days in monsoon
        anomaly = round(c_rain - 30.0, 1)

    soil = payload.soil_moisture_estimate
    if soil is None:
        from weather_service import compute_soil_moisture_proxy
        soil = compute_soil_moisture_proxy(c_rain, anomaly)

    temp = payload.temperature
    if temp is None:
        # Default lapse rate calculation if missing
        temp = round(28.0 - ((elev or 800.0) * 0.0065), 1)

    features_list = ml_config.get("features", [
        "day1_rainfall", "day2_rainfall", "day3_rainfall",
        "cumulative_3day_rainfall", "rainfall_anomaly",
        "elevation", "slope", "aspect", "soil_moisture_estimate",
        "temperature"
    ])

    input_data = {
        "day1_rainfall": payload.day1_rainfall,
        "day2_rainfall": payload.day2_rainfall,
        "day3_rainfall": payload.day3_rainfall,
        "cumulative_3day_rainfall": c_rain,
        "rainfall_anomaly": anomaly,
        "elevation": elev,
        "slope": slp,
        "aspect": asp,
        "soil_moisture_estimate": soil,
        "temperature": temp
    }

    df_test = pd.DataFrame([input_data])[features_list]
    prob = float(ml_model.predict_proba(df_test)[0, 1])
    level = map_score_to_level(prob)

    return {
        "location_name": payload.location_name,
        "coordinates": {"lat": payload.latitude, "lon": payload.longitude},
        "risk_score": round(prob, 4),
        "risk_score_pct": round(prob * 100.0, 1),
        "risk_level": level,
        "input_features": input_data
    }


@app.post("/trigger-pipeline")
async def trigger_pipeline(background_tasks: BackgroundTasks):
    """
    On-demand pipeline trigger endpoint for live hackathon jury demonstrations.
    Immediately re-scores all monitored locations and broadcasts to Supabase Realtime.
    """
    background_tasks.add_task(run_pipeline_cycle)
    return {
        "status": "initiated",
        "message": "Landslide evaluation pipeline triggered in background for all monitored NER locations.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/test-alert")
def trigger_test_alert(
    payload: Optional[TestAlertRequest] = None,
    phone: Optional[str] = Query(None, description="Optional recipient phone number to test directly"),
    location_name: Optional[str] = Query(None, description="Monitored site name"),
    risk_score: Optional[float] = Query(None, description="Simulated landslide risk score")
):
    """
    Triggers an immediate emergency landslide alert via mobile push (ntfy.sh) & SMS
    bypassing debounce for live demonstrations and testing.
    """
    target_loc = (payload.location_name if payload and payload.location_name else None) or location_name or "Noney (Tupul Railway Corridor)"
    target_score = (payload.risk_score if payload and payload.risk_score is not None else None) or (risk_score if risk_score is not None else 0.95)
    target_phone = (payload.phone if payload and payload.phone else None) or phone

    results = dispatch_sms_alert(supabase_client, target_loc, target_score, "High", bypass_debounce=True)
    ntfy_topic = os.getenv("NTFY_TOPIC", "bhujanrakshak_alerts").strip()
    return {
        "status": "success",
        "ntfy_url": f"https://ntfy.sh/{ntfy_topic}",
        "dispatched_alerts": results
    }


@app.get("/api/weather/live")
def get_live_weather(
    latitude: float = Query(24.7174, description="Target site latitude"),
    longitude: float = Query(93.6331, description="Target site longitude")
):
    """
    Fetches real-time meteorological observations for coordinates (Open-Meteo & IMD grids).
    Returns temperature, relative humidity, current precipitation, and soil moisture estimates.
    """
    import urllib.request
    import json
    
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={latitude}&longitude={longitude}&"
        f"current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&"
        f"hourly=precipitation,soil_moisture_0_to_1cm&timezone=auto"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "BhujanRakshak-EarlyWarning/1.0"})
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
            current = data.get("current", {})
            return {
                "status": "success",
                "latitude": latitude,
                "longitude": longitude,
                "temperature": current.get("temperature_2m", 24.5),
                "relative_humidity": current.get("relative_humidity_2m", 82),
                "precipitation_mm": current.get("precipitation", 0.0),
                "weather_code": current.get("weather_code", 0),
                "wind_speed_kmh": current.get("wind_speed_10m", 12.0),
                "timestamp": current.get("time", datetime.now(timezone.utc).isoformat())
            }
    except Exception as e:
        logger.warning(f"Error querying live weather: {e}. Using deterministic seasonal fallback.")
        return {
            "status": "fallback",
            "latitude": latitude,
            "longitude": longitude,
            "temperature": 24.0,
            "relative_humidity": 85,
            "precipitation_mm": 15.2,
            "weather_code": 63,
            "wind_speed_kmh": 14.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }




if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
