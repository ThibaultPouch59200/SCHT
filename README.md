# SC Hauling Tracker

A dark HUD-themed web app for tracking cargo hauling missions in Star Citizen.
Manage your active deliveries, log missions, and monitor your earnings — all stored locally in your browser.

---

## Features

- **Home** — Live delivery board grouped by planet and station. Check off individual resources or confirm an entire station at once. Missions auto-complete when all cargo is delivered.
- **Missions** — Create and manage hauling missions with dynamic cargo lines. Autocomplete dropdowns for origins, destinations, and resources with on-the-fly creation.
- **Finance** — Track your wallet, view 30-day earnings chart, and browse full transaction history with per-mission earnings automatically logged.
- **Settings** — Manage your location and resource lists. One-click import of all 35 Stanton system locations (planets, moons, L-point stations).

All data is persisted in `localStorage` — no backend required.

---

## Stack

| | |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| State | Zustand (with localStorage persistence) |
| Styling | Custom CSS (HUD dark theme) + Tailwind CSS |
| Charts | Chart.js + react-chartjs-2 |
| Routing | React Router v7 |
| Icons | Lucide React |

---

## Getting Started

### Local development

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Production build

```bash
npm run build
npm run preview
```

### Docker

```bash
docker compose up -d
# → http://localhost:80
```

The Docker setup uses a multi-stage build:
1. **deps** — installs Node dependencies
2. **builder** — compiles the Vite/TypeScript app
3. **runner** — serves the static `dist/` via nginx with gzip and SPA routing

---

## Project Structure

```
src/
├── App.tsx                     # Router + layout
├── index.css                   # Global CSS variables + HUD theme
│
├── data/
│   └── stantonLocations.ts     # 35 pre-defined Stanton system locations
│
├── store/
│   ├── useMissionStore.ts      # Missions, delivery tracking, completion logic
│   ├── useFinanceStore.ts      # Wallet, transactions
│   └── useListsStore.ts        # Locations (origin & destination) + resources
│
├── types/
│   └── index.ts                # Mission, CargoLine, Transaction
│
├── utils/
│   └── parseAmount.ts          # SC amount parsing (90k, 1.5M) + formatting
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── ui/
│   │   ├── ClipCard.tsx        # Angled clip-path card component
│   │   ├── ComboSelect.tsx     # Autocomplete dropdown with inline creation
│   │   ├── Modal.tsx
│   │   └── StatusBadge.tsx
│   └── home/
│       ├── PlanetGroup.tsx
│       ├── StationBlock.tsx
│       └── ResourceRow.tsx
│
└── pages/
    ├── Home.tsx
    ├── Missions.tsx
    ├── Finance.tsx
    └── Settings.tsx
```

---

## Stanton Locations

The settings page includes a one-click import of all known Stanton system trading locations:

| Planet | Key locations |
|---|---|
| Hurston | Lorville, Everus Harbor, HUR-L2/L3/L4/L5, Arial, Aberdeen, Magda, Ita |
| Crusader | Orison, CRU-L1/L4/L5, GrimHex, Yela, Cellin, Daymar |
| ArcCorp | Area18, Baijini Point, ARC-L2/L4/L5, Lyria, Wala |
| MicroTech | New Babbage, Port Tressler, MIC-L2/L3/L4/L5, Calliope, Clio, Euterpe |
