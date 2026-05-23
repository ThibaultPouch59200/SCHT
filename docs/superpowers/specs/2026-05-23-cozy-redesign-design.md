# SCHT Cozy Redesign — Design Spec

**Date:** 2026-05-23  
**Status:** Approved  

---

## Overview

Full visual redesign of the SC Hauling Tracker frontend. The goal is to replace the current dark HUD/cockpit aesthetic with a warm, cozy feel — approachable and calm rather than technical and intense. Simultaneously, Finance and Dashboard pages are removed to streamline the app.

---

## Pages

### Removed
- **Finance** — wallet, chart, and transaction history pages are deleted entirely
- **Dashboard** — summary KPI page is removed

### Kept (5 pages)
- **Operations** (was "Home") — live delivery board
- **Missions** — create and manage missions
- **History** — completed missions log
- **Settings** — locations, resources, ship, backup
- **Info** — help/about page

---

## Visual Direction

### Palette — Terracotta & Blush

| Token | Value | Role |
|---|---|---|
| `--bg-page` | `#f5eeec` | Page background |
| `--bg-surface` | `#fdf6f4` | Cards, topbar |
| `--bg-panel` | `#ead8d0` | Nav dock, panel backgrounds |
| `--bg-hover` | `#faf0ec` | Row hover |
| `--border` | `#e8d5cc` | Default borders |
| `--border-accent` | `#d4927a` | Focused/active borders |
| `--accent` | `#d4927a` | Primary accent (terracotta) |
| `--accent-dark` | `#8b4a3a` | Logo, strong text |
| `--accent-dim` | `#f0e0d8` | Tag backgrounds |
| `--text-hi` | `#3d2318` | Body text |
| `--text-mid` | `#7a5040` | Secondary text |
| `--text-low` | `#9a6858` | Muted/label text |
| `--green` | `#5a8a54` | Delivered / success |
| `--green-bg` | `#e8f0e4` | Success backgrounds |
| `--green-border` | `#b8d4b0` | Success borders |

No dark backgrounds. No amber/orange HUD colors. No high-contrast mode.

### Typography — Nunito (Google Fonts)

Single font family throughout: **Nunito** (weights 400, 500, 600, 700, 800).

- No monospace fonts in the UI (remove `--font-mono` entirely)
- No all-caps labels with wide letter-spacing
- Page titles: 22px, weight 800
- Section labels: 10px, weight 700, `text-transform: uppercase`, `letter-spacing: 0.06em` — kept minimal and warm, not techy
- Body text: 13–14px, weight 500–600
- Numbers/values: Nunito weight 700 (no monospace)

### Shape & Space

- **Border radius**: 8–12px on cards, 20–40px on pills/badges/buttons, 6px on inputs
- **No sharp edges** anywhere — the current site's square corners are fully replaced
- **Generous padding**: 20–24px page padding, 10–14px card padding
- **Soft shadows**: `box-shadow: 0 2px 12px rgba(139,74,58,0.08)` on card hover
- **Borders**: 1px solid, warm tones — never high-contrast

---

## Layout — Icon Dock

The current sidebar + topbar layout is **replaced** with a single top bar containing an icon dock.

### Topbar structure

```
[ Logo ] ————————————— [ Nav Dock ] ————————————— [ Status ]
```

- **Logo**: "SC**HT**" — weight 800, accent color on "HT"
- **Nav Dock**: pill-shaped container (`border-radius: 50px`, `background: --bg-panel`), holding 5 nav buttons
  - Each button: icon + label text, `border-radius: 40px`, highlights with `--bg-surface` background when active
  - Active badge on Missions if there are active missions
- **Status**: SCU en transit count (right side, muted)

### Nav items

| Icon | Label | Route |
|---|---|---|
| 🚚 | Operations | `/operations` |
| 📦 | Missions | `/missions` |
| 📜 | History | `/history` |
| ⚙️ | Settings | `/settings` |
| 💡 | Info | `/info` |

The root route `/` redirects to `/operations`.

### Content area

Full-width below the topbar. `padding: 24px`. Scrollable. No sidebar gutters.

---

## Component Changes

### Cards (station blocks, mission cards)

- `border-radius: 12px`
- `background: --bg-surface`
- `border: 1px solid --border`
- Hover: subtle shadow + `border-color: --accent`
- Done/completed state: muted opacity + green border tint

### Buttons

- Rounded pill buttons (`border-radius: 20–40px`) replace all sharp rectangular buttons
- Primary action: terracotta background or border
- Confirm/success: green bg + border
- Destructive: soft red, only on hover (not always visible)

### Inputs

- `border-radius: 6px`
- `border: 1px solid --border`
- Focus: `border-color: --accent`
- Background: `--bg-page` (warm off-white)

### Status badges / pills

- Replace all sharp rectangular badges with `border-radius: 20px` pills
- Active: terracotta pill
- Done: green pill
- SCU count: muted warm pill

### Empty states

- Centered, icon + message, warm muted colors
- No dashed borders

---

## Files to Change

### Delete
- `src/pages/Finance.tsx`
- `src/pages/Dashboard.tsx` (and its route + nav link)

### Rewrite
- `src/index.css` — full rewrite with new design system
- `src/components/layout/NavBar.tsx` — **new file** replacing both old `Sidebar.tsx` and `Topbar.tsx`; implements the icon dock

### Delete
- `src/components/layout/Sidebar.tsx` — replaced by `NavBar.tsx`
- `src/components/layout/Topbar.tsx` — replaced by `NavBar.tsx`

### Update (component-level styling)
- `src/App.tsx` — routing (remove Finance/Dashboard routes, redirect `/` to `/operations`, swap `<Sidebar>` + `<Topbar>` for `<NavBar>`)
- `src/components/home/PlanetGroup.tsx` — rounded cards, new palette classes
- `src/components/home/StationBlock.tsx` — rounded cards, pill buttons
- `src/components/home/ResourceRow.tsx` — warm styling, rounded checkbox
- `src/components/ui/ClipCard.tsx` — clip-path card replaced with standard rounded card
- `src/components/ui/ComboSelect.tsx` — warm palette inputs
- `src/components/ui/Modal.tsx` — rounded, warm palette
- `src/components/ui/StatusBadge.tsx` — pill shape
- `src/pages/Missions.tsx` — warm form styling, rounded inputs
- `src/pages/History.tsx` — warm palette
- `src/pages/Settings.tsx` — warm palette
- `src/pages/Info.tsx` — warm palette

### Update (store)
- `src/store/useFinanceStore.ts` — keep file but Finance page is removed from routing
- `src/components/layout/Sidebar.tsx` (new topbar) — remove `useFinanceStore` wallet display from nav

---

## Implementation Approach

**Full CSS rewrite** — tear out `index.css` entirely and write a new design system from scratch. Then update each component. No migration shim, no parallel theme file.

Order of work:
1. New `index.css` with all CSS variables and global base styles
2. New icon dock topbar component
3. Update `App.tsx` routing
4. Update page components one by one
5. Remove Finance and Dashboard pages

---

## Out of Scope

- Backend changes
- Data model changes
- New features
- Mobile/responsive layout (not currently supported, stays as-is)
- Login page redesign (low priority, left for later)
