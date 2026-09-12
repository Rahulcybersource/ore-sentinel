# ORE-SENTINEL — AI/ML & Space-Tech Decision-Support for MOIL Mines

An operational intelligence platform that fuses **real satellite imagery** (Copernicus Sentinel-2 NDVI, NASA MODIS LST) and **live weather forecasts** (Open-Meteo) with mine-internal data to predict production shortfalls before they happen — and recommend mitigations that require **explicit human approval** before any action is taken.

## Data Transparency

| Source | Status | License / Attribution |
|---|---|---|
| Sentinel-2 NDVI | **REAL** — via Copernicus Data Space | Contains modified Copernicus Sentinel data [2026] |
| MODIS LST | **REAL** — via NASA AppEEARS | MODIS MOD11A2, NASA LP DAAC |
| Rainfall Forecast | **REAL** — via Open-Meteo | Open-Meteo (open data, no key) |
| Production / Alerts / Recommendations | **MOCK** — pending MOIL data-sharing agreement | Clearly labeled `// MOCK DATA` in code |

## Run Locally

```bash
# 1. Backend proxy (requires .env with real API keys — see .env.example)
cd services/data-proxy && npm install && npx tsx src/index.ts

# 2. Frontend
cd apps/web && npm install && npm run dev
```

## Deployment (Production)

### Frontend (Firebase Hosting)
1. `cd apps/web && npm run build`
2. `firebase deploy --only hosting`

### Backend Proxy (Google Cloud Run)
1. `cd services/data-proxy`
2. `gcloud run deploy data-proxy --source . --set-secrets="COPERNICUS_CLIENT_ID=...,COPERNICUS_CLIENT_SECRET=...,NASA_EARTHDATA_TOKEN=...,DATA_GOV_IN_API_KEY=..." --set-env-vars="FRONTEND_URL=https://<your-firebase-url>.web.app,OFFLINE_MODE=false"`

*(API Keys are injected securely via Google Cloud Secret Manager at runtime, never committed to git.)*

## Judge Demo Path (4 steps, ~3 minutes)

1. **Dashboard** (`/`) — KPI cards count up; sparkline and top-3 risks load from adapters
2. **Reserve Map** (`/map`) — 3D terrain with probability heatmap; click a cell to see contributing factors
3. **Alerts → Recommendations** (`/alerts` → expand → "See Recommendations") — cause breakdown bar animates; the **HUMAN APPROVAL REQUIRED** banner is prominently visible
4. **Corporate Roll-Up** (`/corporate`) — multi-mine aggregation proves the system scales beyond a single pilot
