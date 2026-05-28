# SCHT v2 — Design Spec

**Branch:** `feat/v2`  
**Date:** 2026-05-28  
**Design source:** Claude Design handoff bundle (Noir Spatial theme)

---

## 1. Overview

Complete redesign of the SCHT (Star Citizen Hauling Tracker) frontend and backend. The new interface adopts the **Noir Spatial** aesthetic from the design handoff: near-black surfaces, single gold key-light, Oswald display type, Share Tech Mono body font, sharp corners, visible borders, no gradients.

The data model is replaced entirely: the old `Mission / CargoLine` structure becomes `Contract / ContractStop / StopItem`, supporting multiple pickup AND multiple delivery stops per contract.

---

## 2. Architecture

### Stack
- **Frontend:** React + TypeScript + Vite, plain CSS (Tailwind removed)
- **Backend:** Express + Prisma + PostgreSQL
- **Auth:** JWT (unchanged)

### Frontend structure

```
frontend/src/
  App.tsx               ← Auth gate → AppShell
  AppShell.tsx          ← Chrome top, view state (BOARD/SETUP/EXEC), fleet drawer mount
  pages/
    Board.tsx           ← Contracts list table
    Setup.tsx           ← Contract creation/edit form
    Execute.tsx         ← Route map + checklists + remaining sidebar
  components/
    fleet/FleetDrawer.tsx
    ui/Badge.tsx
    ui/CapacityBar.tsx
  store/
    useContractStore.ts
    useFleetStore.ts
    useAuthStore.ts     ← unchanged
  index.css             ← Full Noir Spatial theme (replaces current)
```

### Navigation
React Router is removed. AppShell manages `view: "BOARD" | "SETUP" | "EXEC"` and `activeContractId: number | null` as local state. Login remains as a full-screen gate component.

---

## 3. Data Model

### New Prisma models

```prisma
model Contract {
  id        Int            @id @default(autoincrement())
  userId    Int
  name      String
  client    String         @default("")
  status    String         @default("PENDING")  // PENDING | IN_PROGRESS | COMPLETED
  payout    Int            @default(0)
  createdAt DateTime       @default(now())
  user      User           @relation(fields: [userId], references: [id])
  stops     ContractStop[]
  ships     ContractShip[]
}

model ContractStop {
  id         Int        @id @default(autoincrement())
  contractId Int
  type       String     // PICKUP | DELIVERY
  station    String
  position   Int
  contract   Contract   @relation(fields: [contractId], references: [id], onDelete: Cascade)
  items      StopItem[]
}

model StopItem {
  id       Int          @id @default(autoincrement())
  stopId   Int
  material String
  qty      Int
  done     Boolean      @default(false)
  stop     ContractStop @relation(fields: [stopId], references: [id], onDelete: Cascade)
}

model ContractShip {
  contractId Int
  shipId     Int
  contract   Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  ship       Ship     @relation(fields: [shipId], references: [id])
  @@id([contractId, shipId])
}
```

### Models removed
`Mission`, `CargoLine`, `DeliveredAmount`, `Location`, `Resource`

### Models kept / adapted
- `User`: remove `selectedShipId` field
- `Ship`: rename `manufacturer` → `model`, add `pilot String @default("")`, add `ContractShip[]` relation; existing `category` field dropped
- `Transaction`: kept in schema, not exposed in v2 UI

---

## 4. Backend Routes

### New: `/api/contracts`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/contracts` | List all contracts for authenticated user |
| `POST` | `/api/contracts` | Create contract with stops, items, ships |
| `GET` | `/api/contracts/:id` | Get single contract |
| `PATCH` | `/api/contracts/:id` | Update name/client/payout/status/ships/stops |
| `DELETE` | `/api/contracts/:id` | Delete contract |
| `PATCH` | `/api/contracts/:id/stops/:stopId/items/:itemId/toggle` | Toggle item done |

### Response shape

```ts
{
  id: number
  name: string
  client: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  payout: number
  createdAt: string
  ships: { id: number; name: string; model: string; pilot: string; scu: number }[]
  stops: {
    id: number
    type: "PICKUP" | "DELIVERY"
    station: string
    position: number
    items: { id: number; material: string; qty: number; done: boolean }[]
  }[]
}
```

### Routes kept / extended
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/ships` — returns `{ id, name, model, pilot, scu }`
- `POST /api/ships` — create ship (used by Fleet Drawer "Register Ship")
- `DELETE /api/ships/:id` — remove ship

### Routes removed
`/api/missions`, `/api/locations`, `/api/resources`, `/api/finance`

---

## 5. Frontend Views

### AppShell
- Sticky chrome top: brand mark + "SCHT" / "HAULING OPS", nav tabs (BOARD / SETUP / EXECUTE), FLEET ROSTER button
- Active tab underlined in amber
- View state + activeContractId managed here
- FleetDrawer mounted here when `fleetOpen === true`

### New Contract flow
Clicking `+ NEW CONTRACT` immediately calls `POST /api/contracts` (creates a blank PENDING contract server-side), then opens Setup with the returned ID. DISCARD on a brand-new contract calls `DELETE /api/contracts/:id` before returning to Board. DISCARD on an existing contract navigates back without saving (changes are lost — no optimistic store update).

### Board
- Page header: "Contracts" title + filter toggle (ALL/PENDING/IN PROGRESS/COMPLETED) + `+ NEW CONTRACT` button
- Panel with table: ID (cyan mono) · Contract name + client subtitle · Status badge · SCU (sum of all pickup items) · Stops count · Payout · Action button
- Row click = select, double-click = open Setup, EXECUTE button = open Execute
- Status badge colors: PENDING=grey, IN PROGRESS=silver, COMPLETED=amber

### Setup
- Page header: contract ID + "Configure Contract" + actions (DISCARD / SAVE DRAFT / COMMIT & EXECUTE)
- Row 1 (grid-12): Contract Meta panel (span 6) + Assigned Fleet panel (span 6)
  - Meta: ID (disabled), display name, client, payout
  - Fleet: checkbox list of ships, shows fleet total SCU
- Row 2 (grid-12): Pickup Points panel (span 6) + Delivery Points panel (span 6)
  - Each stop: station name = free text `<input>` with datalist autocomplete from a hardcoded Stanton stations list (same 14 stations as the design). Material = free text input (no predefined list). Qty = number input.
  - Add stop buttons in panel headers
- Row 3: Capacity Analysis panel
  - Fleet total bar (amber, danger on overflow)
  - Per-ship bars (cyan)
  - Per-material bars

### Execute
- Page header: contract ID + contract name + status badge + BOARD button + COMPLETE button (disabled until 100%)
- Route map panel: horizontal scroll, nodes alternating PICKUP (amber border) / DELIVERY (silver border), dashed connectors with ▶, progress bar per node
- Grid 8/4:
  - Left (8): one panel per stop, checklist of items with checkbox + material name + qty + assigned ship label; CHECK ALL / UNCHECK ALL button
  - Right (4): sticky "Remaining Work" panel — progress bar, grouped remaining items by stop

### FleetDrawer
- Right-side overlay drawer, closes on overlay click or ESC
- Header: "FLEET ROSTER" in Oswald + ESC hint + close button
- Stats grid: Active Ships / Total Capacity
- SOLO / FLEET mode toggle
- Ship list: each ship shows name, model, pilot, SCU cap bar; toggle active (●/○) + remove (✕)
- Register Ship form (call sign, model, pilot, SCU) — collapsible

---

## 6. CSS Theme

Full replacement of `index.css` with Noir Spatial variables and component classes.

**Key variables:**
```css
--bg: #0b0b0c       --bg-2: #131315
--surface: #131315  --surface-2: #1a1a1d
--line: #232327     --line-2: #34343a
--text: #ededed     --text-2: #9a9a9f    --muted: #5c5c62
--amber: #e8c87a    --amber-soft: #d8b66a  --amber-deep: #8a6f3a
--cyan: #d9d9d9     --cyan-soft: #8d8d93
--danger: #d65b5b
--font-disp: "Oswald"
```

**Body font:** Share Tech Mono (Google Fonts)  
**Removed:** Tailwind, Nunito, all warm-terracotta variables, dark mode toggle (dark-only theme)

**Component classes ported from design:** `.panel`, `.panel__hd`, `.btn`, `.badge`, `.table`, `.route`, `.route__node`, `.checklist`, `.check-row`, `.bar`, `.drawer`, `.toggle`, `.field`, `.input`, `.select`, `.point`, `.mat-row`, `.stat-grid`, `.stat`, `.ship`

---

## 7. What's Removed in v2

- React Router (all `<Route>` / `<Link>`)
- Pages: Home, Missions, History, Info, Settings
- Components: NavBar, AppLoader, PlanetGroup, StationBlock, ResourceRow, StatusBadge, ComboSelect, Modal
- Stores: useMissionStore, useListsStore, useShipStore, useFinanceStore
- CSS: all current index.css, App.css, Tailwind config
- Backend routes: missions, locations, resources, finance
- Prisma models: Mission, CargoLine, DeliveredAmount, Location, Resource

---

## 8. What's Kept

- Auth flow: `useAuthStore`, `LoginPage`, JWT middleware
- `User` model (adapted)
- `Ship` model (adapted: manufacturer→model, add pilot)
- `Transaction` model (schema only, not exposed in v2)
- Docker / docker-compose setup
- Vite config, tsconfig
