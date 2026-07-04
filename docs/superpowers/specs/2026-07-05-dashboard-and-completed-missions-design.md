# Dashboard + missions terminées inline — design

**Date :** 2026-07-05
**Statut :** design validé (maquette Dashboard approuvée via compagnon visuel), en attente de relecture
**Branche cible :** `redesign-cargo-terminal` (poursuit la PR de la refonte, non encore mergée)

---

## 1. Contexte et objectif

Suite de la refonte Cargo Terminal. Trois changements, **100 % frontend** (le store
récupère déjà toutes les missions, `completedAt` inclus — aucune migration ni route
API) :

1. **Retirer le Journal** (écran séparé des missions terminées).
2. **Garder les missions terminées visibles**, grisées/barrées, dans la page Missions.
3. **Ajouter un Dashboard** : tuiles KPI, grille de contribution type GitHub
   (contrats terminés/jour), aperçu des missions en cours, et un top stations/matières.

### Non-objectifs
- Aucun changement backend/DB/API.
- Pas de graphiques temporels autres que la grille de contribution.
- L'écran d'accueil **reste la Route** (`/` → `/operations`) ; le Dashboard est une
  entrée de nav.

---

## 2. Retrait du Journal

- Supprimer `frontend/src/pages/History.tsx`.
- `frontend/src/App.tsx` : retirer la route `/history`.
- `frontend/src/components/layout/NavBar.tsx` : remplacer l'entrée « Journal »
  (`/history`) par « Dashboard » (`/dashboard`). Ordre nav final :
  **Route · Missions · Dashboard · Réglages** (+ icône Info, logout).

## 3. Missions terminées inline (page Missions)

`frontend/src/pages/Missions.tsx` :
- Ne plus filtrer les missions terminées hors de la liste.
- Deux groupes : **Actives** (missions sans `completedAt`, rendu inchangé) puis, si
  au moins une existe, une section **« Terminées »** listant les missions avec
  `completedAt`, chaque carte en état terminé : opacité réduite **et** `line-through`
  sur le titre de route (classe `.ct-mission-card.done`). Actions Copier conservée ;
  Supprimer conservée. La gauge de capacité en tête ne compte que les cargaisons
  `LOADED` des missions actives (inchangé).
- La **Route** continue d'ignorer les missions terminées (`buildRoute` filtre déjà
  `completedAt`) — pas de changement.

## 4. Écran Dashboard

Nouveau `frontend/src/pages/Dashboard.tsx` (`/dashboard`), style Cargo Terminal.
Il lit `useMissionStore` (toutes les missions) et calcule tout via `lib/stats.ts`.
Quatre blocs, de haut en bas :

### 4.1 Tuiles KPI (`components/dashboard/KpiTiles.tsx`)
Quatre cartes `.ct-kpi` (bordure-gauche colorée) :
- **En cours** — nb de missions sans `completedAt`.
- **Terminées** — nb de missions avec `completedAt`.
- **SCU livré** — somme des `scu` des cargaisons `DELIVERED`.
- **Cargaisons** — nb de cargaisons `DELIVERED`.

### 4.2 Grille de contribution (`components/dashboard/ContributionGrid.tsx`)
- **13 semaines × 7 jours**, en **pleine largeur** (`grid-template-columns:repeat(13,1fr)`),
  cases rectangulaires (~26px de haut), gap 4px. Colonnes = semaines (récentes à droite),
  lignes = jours (Lun→Dim).
- Intensité = nombre de missions dont `completedAt` tombe ce jour-là, mappée sur
  **5 niveaux** (`.ct-cell` + `.l1`…`.l4`) par seuils fixes : 0 → vide, 1 → l1,
  2 → l2, 3 → l3, ≥4 → l4.
- Labels de mois au-dessus, légende « Moins ▢▢▢▢▢ Plus » en bas.
- `title` par case : « N contrat(s) · <date locale> ».

### 4.3 En cours (`components/dashboard/InProgressList.tsx`)
Liste des missions actives : libellé route (origines→destinations, résumé),
compteur `livrés/total` cargaisons, barre de progression (`.ct-ip-bar`, verte).
Progression = cargaisons `DELIVERED` / total cargaisons de la mission.

### 4.4 Top — par SCU livré (`components/dashboard/TopBreakdown.tsx`)
Deux sous-groupes, uniquement sur cargaisons `DELIVERED` :
- **Stations de livraison** : SCU livré agrégé par `dest`, top 5.
- **Matières** : SCU livré agrégé par `res`, top 5.

Blocs 4.3 et 4.4 côte à côte (grille 2 colonnes), empilés sur mobile.

## 5. Logique — `lib/stats.ts` (pure, testée)

Module pur consommant `Mission[]` (type existant), sans dépendance React :

```ts
export interface DayCell { date: Date; count: number; level: 0|1|2|3|4 }
export interface Kpis { inProgress: number; completed: number; scuDelivered: number; cargosDelivered: number }
export interface TopEntry { name: string; scu: number }

export function computeKpis(missions: Mission[]): Kpis
export function buildContributionGrid(missions: Mission[], opts?: { weeks?: number; today?: Date }): DayCell[][] // weeks columns × 7 days
export function missionProgress(m: Mission): { delivered: number; total: number; pct: number }
export function topDeliveredStations(missions: Mission[], limit?: number): TopEntry[]
export function topDeliveredMaterials(missions: Mission[], limit?: number): TopEntry[]
```

Règles :
- `level` : `count===0?0 : count>=4?4 : count`.
- Grille : fenêtre des `weeks` (défaut 13) dernières semaines se terminant à la semaine
  contenant `today` ; chaque colonne = une semaine (Lun→Dim) ; jours hors de la
  fenêtre absents ; `completedAt` comparé au jour local.
- Agrégats « livrés » : uniquement `status === 'DELIVERED'`.

**Tests Vitest** (`lib/stats.test.ts`) : `computeKpis` (comptages + somme SCU sur DELIVERED
seulement), `buildContributionGrid` (dimensions 13×7, comptage par jour, mapping de niveau,
exclusion hors fenêtre), `missionProgress` (0%, partiel, 100%), `topDeliveredStations`/
`Materials` (agrégation + tri + limite).

## 6. Styles

Ajouts `.ct-*` dans `frontend/src/styles/cargo-terminal.css`, dérivés de la maquette
validée (`.superpowers/brainstorm/81833-1783204350/content/dashboard-v3.html`) :
`.ct-kpi(.blue/.green)`, `.ct-grid-wrap`, `.ct-grid`, `.ct-col`, `.ct-cell(.l1..l4)`,
`.ct-grid-legend`, `.ct-grid-months`, `.ct-ip*`, `.ct-top*`, `.ct-dash-two`, et
`.ct-mission-card.done` (opacité + `line-through`) pour la page Missions.

## 7. Fichiers

- Supprimer : `frontend/src/pages/History.tsx`.
- Créer : `frontend/src/pages/Dashboard.tsx`, `frontend/src/components/dashboard/{KpiTiles,ContributionGrid,InProgressList,TopBreakdown}.tsx`, `frontend/src/lib/stats.ts`, `frontend/src/lib/stats.test.ts`.
- Modifier : `frontend/src/App.tsx`, `frontend/src/components/layout/NavBar.tsx`, `frontend/src/pages/Missions.tsx`, `frontend/src/styles/cargo-terminal.css`.

## 8. Décisions par défaut (confirmées à la maquette)
- Écran d'accueil = Route (Dashboard via nav). *À confirmer si tu préfères le Dashboard en accueil.*
- Grille : 13 semaines, missions terminées/jour, pleine largeur.
- Top par SCU livré (pas par nombre de contrats).
- Missions terminées : opacité réduite **et** barré.
