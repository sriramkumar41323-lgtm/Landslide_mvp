# BhujanRakshak: AI-Based Landslide Early Warning System for North Eastern Region (NER) India
**Smart India Hackathon (SIH) MVP Prototype**

BhujanRakshak is an end-to-end AI-powered geological landslide early warning and hazard monitoring system specifically calibrated for the rugged mountainous corridors of North Eastern India (Manipur, Mizoram, Meghalaya, Assam, Nagaland, Arunachal Pradesh, Sikkim).

---

## System Architecture

The project is structured into five integrated components:

```
Landslide_mvp/
├── data_pipeline/              # Phase 1: Data Collection & Feature Preprocessing
│   ├── data/                   # Historical landslide events CSV (GSI Bhukosh / Seed)
│   ├── dem/                    # SRTM GeoTIFF DEMs (rasterio slope/aspect/elevation)
│   ├── output/                 # training_dataset.csv (1:4 positive to negative ratio)
│   ├── build_dataset.py        # Canonical dataset generation pipeline
│   ├── terrain.py              # Rasterio DEM terrain extractor + synthetic fallback
│   └── weather_service.py      # Meteostat rainfall + GLDAS soil moisture proxy
├── model_training/             # Phase 2: Chronological Machine Learning
│   ├── train_model.py          # Balanced RandomForestClassifier + Tupul Backtest
│   ├── model.joblib            # Serialized trained model
│   └── config.json             # Feature list, risk thresholds & evaluation metrics
├── backend/                    # Phase 3: FastAPI Bridge Server & Scheduler
│   ├── main.py                 # FastAPI REST API & APScheduler 1-hr recurring pipeline
│   ├── alert_service.py        # 3-Hour debouncing & Twilio SMS emergency dispatcher
│   ├── locations.json          # Monitored NER sites (Noney, Aizawl, Khasi Hills, etc.)
│   ├── supabase_schema.sql     # Phase 4: PostgreSQL Schema Migration & Realtime setup
│   ├── .env                    # Backend environment config
│   └── .env.example            # Environment template
├── src/                        # Phase 5: React + Leaflet Frontend
│   ├── components/             # MapView, AlertLogPanel, AuthorityDashboard, Navbar
│   ├── services/               # Supabase Realtime client, Telemetry Engine, Offline sync
│   └── data/                   # GIS arterial highway contours & station data
├── package.json                # Frontend NPM configuration
└── README.md                   # System documentation
```

---

## Synthetic & Proxy Data Documentation

To guarantee reliable operation during live demonstrations and field evaluations without relying on uninterrupted satellite feeds, the system clearly specifies which components utilize synthetic/proxy heuristics:

1. **Soil Moisture Saturation Proxy (`soil_moisture_estimate`)**:
   - *Purpose*: Serves as a deterministic mathematical proxy for real NASA GLDAS-2.1 / Noah Land Surface Model volumetric soil moisture data.
   - *Formula*: `Base 25% + (0.42 * cumulative_3day_rainfall) + (0.15 * max(0, rainfall_anomaly))`, clamped between 15% and 99%.
   - *Rationale*: Real GLDAS data has latency (~2-4 days) that is impractical for live real-time demonstrations. The proxy accurately mirrors soil pore pressure dynamics.

2. **Antecedent Rainfall & Mountain Microclimate Fallback**:
   - *Library*: `meteostat` fetches historical and current daily precipitation.
   - *Fallback*: Remote mountain gorges in NER occasionally have weather station data gaps. When Meteostat returns missing observations, the system seamlessly applies a seasonal climatology baseline model for NER (monsoon intensities calibrated to IMD normals) so the pipeline never halts.

3. **Digital Elevation Model (DEM) Topography Fallback**:
   - *Library*: `rasterio` extracts elevation, slope, and aspect from SRTM GeoTIFF files (`/data_pipeline/dem/ner_srtm.tif` or regional tiles `n24_e093_1arc_v3.tif`, `n25_e091_1arc_v3.tif`).
   - *Fallback*: If a GeoTIFF tile covering the point is absent, `terrain.py` logs a clear warning and derives elevation and slope using an empirical geomorphological model calibrated to the Barail, Lushai, and Khasi-Jaintia ranges.

---

## Phase 1: Data Collection & Pipeline Setup

### 1. Requirements Installation
Ensure Python 3.10+ is installed:
```bash
pip install pandas numpy scikit-learn rasterio meteostat joblib fastapi uvicorn supabase apscheduler twilio python-dotenv
```

### 2. Generate Training Dataset
```bash
python data_pipeline/build_dataset.py
```
Outputs `/data_pipeline/output/training_dataset.csv` with columns:
`date, location_name, latitude, longitude, day1_rainfall, day2_rainfall, day3_rainfall, cumulative_3day_rainfall, rainfall_anomaly, elevation, slope, aspect, soil_moisture_estimate, landslide_occurred`

Target positive-to-negative ratio: **1:4.0** (10 positive events, 40 negative safe samples).

---

## Phase 2: Model Training & Historical Backtest

Train the balanced Random Forest model using a chronological time-based split:
```bash
python model_training/train_model.py
```

### Key Metrics:
- **Recall on Positive Class**: **100.0%** (critical for life safety disaster systems)
- **ROC-AUC**: **0.7750**
- **Historical Backtest on 2022 Tupul, Manipur Landslide (30 June 2022)**:
  - Conditions: 135.0 mm 3-day rainfall, soil saturation 89.4%
  - Result: **98.4% Risk Score -> HIGH RISK (CORRECT)**
  - Console Log: `BACKTEST RESULT: HIGH RISK (CORRECT)`

Artifacts saved:
- `/model_training/model.joblib`
- `/model_training/config.json` (features, thresholds: Low 0-0.33, Medium 0.33-0.66, High 0.66-1.0)

---

## Phase 3 & 4: FastAPI Bridge Server & Supabase Database

### 1. Supabase Setup
Run the SQL migration script `/backend/supabase_schema.sql` in your Supabase SQL Editor. It creates:
- `location_risk`
- `alert_log`
- `subscribers`
- `field_reports`

And executes the publication command for Supabase Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE location_risk, field_reports, alert_log;
```

### 2. Configure Environment Variables
Create `.env` inside `/backend` (or copy from `.env.example`):
```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_KEY=<your-anon-or-service-role-key>

# Optional: Twilio SMS (if blank, simulated SMS is safely logged to alert_log)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890

PORT=8000
HOST=0.0.0.0
```

### 3. Launch FastAPI Server
From the workspace root:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### REST API Endpoints:
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Server health and ML model status |
| `GET` | `/locations` | Current risk score & levels for all monitored locations |
| `GET` | `/alerts` | Recent alert history from `alert_log` |
| `POST` | `/subscribe` | Register citizen/officer phone number: `{name, phone, location_name}` |
| `GET` | `/model-metrics` | Evaluation metrics, feature importances & backtest results |
| `POST` | `/predict` | Ad-hoc manual prediction endpoint for jury/demo testing |
| `POST` | `/trigger-pipeline` | On-demand background cycle trigger for live demonstrations |

---

## Phase 5: React + Leaflet Frontend

The frontend features real-time Supabase subscriptions, high-contrast Leaflet GIS heatmaps, citizen hazard pins, and an Alert Log modal.

### 1. Frontend Environment (`.env` in root)
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_BACKEND_URL=http://localhost:8000
```

### 2. Build & Launch Frontend
```bash
# Build for production validation
npm run build

# Start local development server
npm run dev
```

### Interactive Features:
1. **Live Supabase Realtime Risk Zones**: Automatically updates map heatmaps when FastAPI publishes new scores.
2. **Citizen Hazard Pins**: Real-time subscriptions to `field_reports`. When a citizen submits a hazard report, a Red Warning Marker/Pin (`#dc2626`) instantly appears at the reported coordinates with a pulsing radar beacon.
3. **Alert Log Panel**: Accessible via the Bell icon in the top navigation bar. Displays real-time SMS delivery status and provides one-click manual pipeline triggers.
