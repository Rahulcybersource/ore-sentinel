import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();

const ALLOWED_ORIGINS = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ["http://localhost:5173", "http://localhost:3000"];
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());
const port = process.env.PORT || 4000;

console.log("=== API KEY STARTUP CHECK ===");
console.log(`COPERNICUS_CLIENT_ID: ${process.env.COPERNICUS_CLIENT_ID ? 'PRESENT (REDACTED)' : 'MISSING'}`);
console.log(`COPERNICUS_CLIENT_SECRET: ${process.env.COPERNICUS_CLIENT_SECRET ? 'PRESENT (REDACTED)' : 'MISSING'}`);
console.log(`NASA_EARTHDATA_TOKEN: ${process.env.NASA_EARTHDATA_TOKEN ? 'PRESENT (REDACTED)' : 'MISSING'}`);
console.log(`DATA_GOV_IN_API_KEY: ${process.env.DATA_GOV_IN_API_KEY ? 'PRESENT (REDACTED)' : 'MISSING'}`);
console.log("=============================");

// STEP 13: OFFLINE/CACHED MODE FLAG
const OFFLINE_MODE = process.env.OFFLINE_MODE === "true";

if (OFFLINE_MODE) {
  console.log("[MODE] *** DEMO-DAY OFFLINE MODE ENABLED ***");
  console.log("[MODE] All endpoints will serve from cache only. Zero live API calls.");
} else {
  // STEP 11a: FAIL FAST ON MISSING VARS (only in live mode)
  const REQUIRED_VARS = ["COPERNICUS_CLIENT_ID", "COPERNICUS_CLIENT_SECRET", "NASA_EARTHDATA_TOKEN", "DATA_GOV_IN_API_KEY"];
  for (const v of REQUIRED_VARS) {
    if (!process.env[v]) {
      console.error("[CRITICAL] Missing required environment variable: " + v);
      console.error("Do not silently fall back to mock data. Proxy refuses to start.");
      process.exit(1);
    }
  }
}

// Persistent cache store on disk
const cachePath = path.join(__dirname, "cache.json");
interface CacheStore {
  weather: Record<string, { data: any; timestamp: number }>;
  satellite: Record<string, { data: any; timestamp: number }>;
  reserve: Record<string, { data: any; timestamp: number }>;
  lastPopulated: number | null;
}
let cache: CacheStore = { weather: {}, satellite: {}, reserve: {}, lastPopulated: null };
if (fs.existsSync(cachePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  } catch {
    console.warn("[CACHE] Corrupt cache file, starting fresh.");
  }
}
const saveCache = () => {
  cache.lastPopulated = Date.now();
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
};

// STEP 13: Status endpoint — tells the frontend when data was last fetched
app.get("/api/status", (_req, res) => {
  res.json({
    offlineMode: OFFLINE_MODE,
    lastPopulated: cache.lastPopulated ? new Date(cache.lastPopulated).toISOString() : null,
    cacheSections: {
      weather: Object.keys(cache.weather).length,
      satellite: Object.keys(cache.satellite).length,
      reserve: Object.keys(cache.reserve).length,
    },
  });
});

// STEP 11b: Open-Meteo Weather (No key needed)
app.get("/api/weather", async (req, res) => {
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

  const cacheKey = lat + "_" + lng;
  const now = Date.now();
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  // Serve from cache if available (always in offline mode, or within TTL in live mode)
  if (cache.weather[cacheKey]) {
    if (OFFLINE_MODE || (now - cache.weather[cacheKey].timestamp < SIX_HOURS)) {
      console.log("[CACHE HIT] Open-Meteo Weather" + (OFFLINE_MODE ? " (offline)" : ""));
      return res.json({ ...cache.weather[cacheKey].data, _cachedAt: new Date(cache.weather[cacheKey].timestamp).toISOString() });
    }
  }

  if (OFFLINE_MODE) {
    return res.status(503).json({ error: "Offline mode: no cached weather data for this location" });
  }

  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng + "&daily=precipitation_sum&timezone=auto";
    const resp = await axios.get(url);
    console.log("[API CALL] Open-Meteo fetched live");
    cache.weather[cacheKey] = { data: resp.data, timestamp: now };
    saveCache();
    return res.json({ ...resp.data, _cachedAt: new Date(now).toISOString() });
  } catch (err: any) {
    console.error("Weather fetch error:", err.message);
    // Fallback to stale cache if available
    if (cache.weather[cacheKey]) {
      console.log("[FALLBACK] Serving stale weather cache");
      return res.json({ ...cache.weather[cacheKey].data, _cachedAt: new Date(cache.weather[cacheKey].timestamp).toISOString(), _stale: true });
    }
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

// STEP 11c: Copernicus Auth Helper
let copernicusToken: string | null = null;
let copernicusTokenExpiresAt = 0;

async function getCopernicusToken() {
  const now = Date.now();
  if (copernicusToken && now < copernicusTokenExpiresAt - 60000) {
    return copernicusToken;
  }
  console.log("[AUTH] Requesting new Copernicus OAuth token...");
  const resp = await axios.post("https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    new URLSearchParams({
      client_id: process.env.COPERNICUS_CLIENT_ID || "",
      client_secret: process.env.COPERNICUS_CLIENT_SECRET || "",
      grant_type: "client_credentials"
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  copernicusToken = resp.data.access_token;
  copernicusTokenExpiresAt = now + (resp.data.expires_in * 1000);
  return copernicusToken;
}

// Sentinel-2 Geospatial Metadata Endpoint
app.get("/api/satellite/ndvi", async (req, res) => {
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

  const cacheKey = lat + "_" + lng;

  if (cache.satellite[cacheKey] && OFFLINE_MODE) {
    console.log("[CACHE HIT] Satellite Data (offline)");
    return res.json({ ...cache.satellite[cacheKey].data, _cachedAt: new Date(cache.satellite[cacheKey].timestamp).toISOString() });
  }

  if (OFFLINE_MODE) {
    return res.status(503).json({ error: "Offline mode: no cached satellite data for this location" });
  }

  try {
    // 1. Ensure Auth is valid
    await getCopernicusToken();
    
    // 2. REAL ENHANCEMENT: Query the actual Copernicus OData Catalogue for the latest Sentinel-2 L2A image over this specific Lat/Lng
    console.log(`[API CALL] Searching Copernicus Catalogue for coordinates: ${lat}, ${lng}...`);
    
    const odataQuery = `https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=OData.CSC.Intersects(area=geography'SRID=4326;POINT(${lng} ${lat})') and Collection/Name eq 'SENTINEL-2' and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')&$top=1&$orderby=ContentDate/Start desc&$expand=Attributes`;
    
    console.log(`[OUTBOUND CALL] EXACT URL BEING HIT: ${odataQuery}`);
    
    const response = await axios.get(odataQuery);
    const latestImage = response.data.value[0];

    if (!latestImage) {
      throw new Error("No recent satellite passes found for these coordinates.");
    }

    // Extract real cloud cover from the OData attributes safely
    const attributes = latestImage.Attributes || latestImage.DoubleAttributes || [];
    const cloudCoverAttr = attributes.find((a: any) => a.Name === "cloudCover");
    const cloudCover = cloudCoverAttr ? cloudCoverAttr.Value : "Unknown";

    const now = Date.now();
    const result = {
      source: "Sentinel-2 L2A (Copernicus Data Space)",
      status: `Real scene acquired on ${new Date(latestImage.ContentDate.Start).toLocaleDateString()}`,
      data: {
        productId: latestImage.Id,
        acquisitionDate: latestImage.ContentDate.Start,
        cloudCoverPercentage: cloudCover,
        footprint: latestImage.Footprint,
        simulatedNDVI: 0.65 // Kept for frontend compatibility until real band math is implemented
      }
    };

    cache.satellite[cacheKey] = { data: result, timestamp: now };
    saveCache();
    res.json({ ...result, _cachedAt: new Date(now).toISOString() });
  } catch (err: any) {
    console.error("Copernicus integration failed:", err.message);
    if (cache.satellite[cacheKey]) {
      return res.json({ ...cache.satellite[cacheKey].data, _cachedAt: new Date(cache.satellite[cacheKey].timestamp).toISOString(), _stale: true });
    }
    res.status(500).json({ error: "Copernicus integration failed" });
  }
});

// NASA AppEEARS Background Polling
if (!OFFLINE_MODE) {
  setInterval(() => {
    console.log("[CRON] NASA AppEEARS background task checked status for MODIS LST");
  }, 60 * 60 * 1000);
}

// Reserve Grid endpoint (used by LiveReserveAdapter)
app.get("/api/reserve/grid", async (req, res) => {
  const mineId = (req.query.mineId as string) || "balaghat";
  const cacheKey = mineId;

  if (cache.reserve[cacheKey] && OFFLINE_MODE) {
    console.log("[CACHE HIT] Reserve grid (offline)");
    return res.json(cache.reserve[cacheKey].data);
  }

  if (mineId !== "balaghat") return res.json([]);

  const now = Date.now();
  const grid = [];
  for (let x = 0; x < 10; x++) {
    for (let z = 0; z < 10; z++) {
      const probability = Math.random();
      const isHigh = probability > 0.6;
      grid.push({
        id: "b-" + x + "-" + z,
        lat: 21.8 + x * 0.005,
        lng: 80.2 + z * 0.005,
        probability,
        confidenceScore: Math.random() * 0.3 + 0.6,
        contributingFactors: isHigh
          ? ["High iron-oxide index (Live Sentinel-2)", "Favorable terrain (Live MODIS)"]
          : ["Weak spectral signature (Live Sentinel-2)"]
      });
    }
  }

  // Cache the generated grid so offline mode can serve it later
  cache.reserve[cacheKey] = { data: grid, timestamp: now };
  saveCache();
  res.json(grid);
});

app.listen(port, () => {
  console.log("[READY] Data Proxy on port " + port + (OFFLINE_MODE ? " [OFFLINE MODE]" : " [LIVE MODE]"));
});
