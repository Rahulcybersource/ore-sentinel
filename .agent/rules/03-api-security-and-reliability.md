# ORE-SENTINEL — Real API Integration: Security & Reliability (Rules)

This project uses real, live external APIs. These rules exist because real APIs introduce failure modes a mock-data prototype never has. Apply them to every task touching external data, without exception.

## Key Security — non-negotiable

- Never write a real API key or secret into any source file, frontend code, or commit. Frontend JavaScript is always inspectable via browser dev tools — a key embedded in a React app is a leaked key.
- All satellite/weather/geological API calls must be made from /services/data-proxy (the backend), never directly from the browser. This also avoids CORS failures.
- Read all credentials from environment variables only. If a required variable is missing at startup, fail fast with a clear named error — never silently fall back to mock data without a visible warning log.
- .env.example must contain variable names only, no real values. .env must be in .gitignore. Never suggest committing .env.
- When deploying, credentials go into the hosting platform's secret manager, never baked into a build artifact.

## Rate Limits & Caching — required, not optional

Every external source used (Copernicus Sentinel Hub, NASA AppEEARS, data.gov.in, Open-Meteo) has a free-tier limit. Design every integration so that:
- Data is fetched on a schedule and stored server-side with a timestamp.
- The frontend always reads from this stored/cached copy — never make a live third-party API call inside the request path of a page the user is loading.
- NASA AppEEARS is asynchronous (submit task, poll, retrieve) — never call it synchronously inside a user-facing request; it must run as a background scheduled job.

## Token Handling

- Copernicus OAuth tokens are short-lived. Any client using them must cache the token in memory and transparently re-request a new one before it expires.
- If a token or credential fails/expires, fall back to the last successfully cached data with a visible "data as of [timestamp]" indicator, rather than showing a blank or broken UI state.

## Demo/Production Reliability

- Support an "offline/cached mode" flag in the data-proxy that serves only from stored cache with zero live external calls — test this with network disabled before considering it done.
- Never surface a terminal, .env file, or raw credentials in any screenshot, recording, or Artifact generated for this project.

## Attribution & Licensing

- Any Copernicus/Sentinel-derived imagery or index shown in the UI must carry a visible attribution (e.g., "Contains modified Copernicus Sentinel data [year]").
- Any NASA/USGS-derived product shown must cite the specific product name (e.g., "MODIS MOD11A2, NASA LP DAAC") in a Data Sources panel.
- If OpenStreetMap tiles are used as a map base layer, the standard "© OpenStreetMap contributors" attribution must remain visible on the map itself.
- Maintain a "Data Sources" panel/screen listing every real external data source in use and its license.

## Data Governance

- Any MOIL-specific production, drilling, or equipment figures used anywhere must come from MOIL's own public disclosures (cite the source) or be clearly marked as mock/synthetic. Never present unverified, scraped, or guessed numbers as MOIL's real internal data, under any circumstance.
