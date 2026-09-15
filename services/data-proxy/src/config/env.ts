import dotenv from "dotenv";

dotenv.config();

const REQUIRED_VARS = [
  "COPERNICUS_CLIENT_ID",
  "COPERNICUS_CLIENT_SECRET",
  "NASA_EARTHDATA_TOKEN",
  "DATA_GOV_IN_API_KEY",
  "ISRO_VEDAS_API_KEY",
  "ISRO_VEDAS_BASE_URL",
];

// Always enforce ISRO_VEDAS_API_KEY is defined as per prompt
if (!process.env.ISRO_VEDAS_API_KEY) {
  console.error("[CRITICAL] ISRO_VEDAS_API_KEY is undefined. Server refusing to boot.");
  process.exit(1);
}

// Ensure offline mode handles other keys gracefully if needed, but the old logic 
// only required them in live mode.
if (process.env.OFFLINE_MODE !== "true") {
  const missingVars = REQUIRED_VARS.filter((v) => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error("[CRITICAL] Missing required environment variable(s):", missingVars.join(", "));
    console.error("Do not silently fall back to mock data. Proxy refuses to start.");
    process.exit(1);
  }
}

export const config = {
  isroVedasApiKey: process.env.ISRO_VEDAS_API_KEY as string,
  isroVedasBaseUrl: process.env.ISRO_VEDAS_BASE_URL as string,
  copernicusClientId: process.env.COPERNICUS_CLIENT_ID || "",
  copernicusClientSecret: process.env.COPERNICUS_CLIENT_SECRET || "",
  nasaEarthdataToken: process.env.NASA_EARTHDATA_TOKEN || "",
  dataGovInApiKey: process.env.DATA_GOV_IN_API_KEY || "",
  frontendUrl: process.env.FRONTEND_URL,
  offlineMode: process.env.OFFLINE_MODE === "true",
  port: process.env.PORT || 4000,
};
