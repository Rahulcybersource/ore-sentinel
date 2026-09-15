# ORE-SENTINEL — Architecture & Conventions (Rules)

These rules apply to every agent session working on this project. Read fully before starting any task.

## Core Philosophy

This is a real, layered application being built for actual handover — not a throwaway prototype. Every screen must talk to a data adapter interface, never to hardcoded values directly. Early on, adapters are backed by mock/sample data (including real public satellite/geological data where available). Later, adapter implementations are swapped to hit live MOIL/satellite APIs — with zero UI code changes required. This is the single decision that makes "upgrade, don't rebuild" true. Do not hardcode data into a component to "just make it work" — refuse to do this even if it seems faster, and flag it back to the user instead.

## Tech Stack

React 18 + TypeScript + Vite, Tailwind CSS, react-three-fiber (Three.js) for 3D, Framer Motion for animation, Recharts or D3 for charts. Backend proxy service in Node.js/Express or Python/FastAPI. Do not introduce a different framework or major library without explicit user confirmation.

## Repo Structure — follow exactly, do not invent a different structure per session

ore-sentinel/
├── .agent/rules/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   ├── screens/
│       │   ├── three/
│       │   ├── data/
│       │   │   ├── adapters/
│       │   │   │   ├── ReserveDataAdapter.ts
│       │   │   │   ├── MockReserveAdapter.ts
│       │   │   │   ├── LiveReserveAdapter.ts
│       │   │   │   ├── ProductionDataAdapter.ts
│       │   │   │   └── ...
│       │   │   └── types/
│       │   ├── theme/
│       │   └── App.tsx
├── services/
│   └── data-proxy/
├── docs/
└── README.md

## Data & Labeling Conventions

- Mock data must be clearly commented as "// MOCK DATA" and use realistic MOIL mine names (Balaghat, Ukwa, Gumgaon, Kandri) with plausible numbers — never placeholder "Lorem ipsum"-style data.
- Real public satellite/geological data, wherever fetched or displayed, must be labeled as such in the UI — never presented as if it is already-integrated MOIL internal live data.
- Never fabricate MOIL-internal production, drilling, or equipment figures to fill a gap. If data is unavailable, use the Mock adapter and label it clearly, or leave it explicitly marked pending.

## Design Language

Vibrant, high-contrast, dark-mode-first industrial/geospatial aesthetic. Deep navy/charcoal background, electric teal primary accent, warm amber secondary accent, clear red-orange for danger/shortfall states. Always check /apps/web/src/theme/tokens.ts before introducing any new color or style — do not invent new ad-hoc colors per screen.

## Target Users

Mine planners, geologists, site managers, corporate/ministry reviewers — mostly non-technical. All UI copy must stay in plain language, not data-science jargon (e.g., say "likely shortfall risk," not "P90 forecast deviation").
