# HAUL//OPS — Cargo Terminal

Une web-app **thème sombre « Cargo Terminal »** pour planifier et suivre tes
tournées de fret multi-mission dans **Star Citizen**. Enchaîne les contrats,
gère le flux **récupération → livraison** station par station, et suis ton
activité sur un dashboard.

---

## Fonctionnalités

- **Dashboard** — tuiles clés (missions en cours / terminées, SCU livré,
  cargaisons), **grille de contribution** type GitHub (contrats terminés par
  jour sur 13 semaines), aperçu des missions en cours avec progression, et top
  stations / matières par SCU livré.
- **Route** — la vue opérationnelle. Toutes les cargaisons en cours, regroupées
  par **station** en une tournée ordonnée. Chaque arrêt indique ce qu'on y
  **▲ charge** et ce qu'on y **▼ dépose**. Une livraison reste **verrouillée**
  tant que sa cargaison n'a pas été récupérée. Ordre **auto** (par système →
  planète → station) ou **manuel** (réordonnancement à la flèche). Jauge de
  capacité de soute selon le vaisseau sélectionné.
- **Missions** — formulaire simplifié : une ligne = une cargaison
  (`matière · SCU · ▲ récup · ▼ livraison`). Les missions terminées restent
  visibles, **grisées / barrées**, sous les missions actives.
- **Réglages** — gestion des lieux (station · planète · système), des matières,
  choix du vaisseau, et import en un clic des lieux du système Stanton.

Chaque cargaison suit le cycle **`PENDING → LOADED → DELIVERED`** ; une mission
est marquée terminée automatiquement quand toutes ses cargaisons sont livrées.

---

## Stack

| | |
|---|---|
| Frontend | React 19 · Vite · TypeScript · Zustand · React Router 7 · Lucide |
| Tests | Vitest (logique de route + agrégats du dashboard) |
| Polices | Oswald · JetBrains Mono · Barlow (bundle local via `@fontsource`) |
| Backend | Express · TypeScript · JWT |
| Base de données | PostgreSQL via Prisma |
| Déploiement | Docker Compose (nginx + node + postgres) |

Modèle de données clé : chaque `CargoLine` porte son **point de récupération**
(`origin`), son **point de livraison** (`dest`) et un **`status`** ; une
`Mission` est un simple regroupement de cargaisons.

---

## Démarrage

### Docker (recommandé)

```bash
docker compose up -d --build
# Frontend → http://localhost:3005
# API      → http://localhost:4000
```

Le conteneur backend applique les migrations Prisma et charge les données de
référence (vaisseaux, lieux, matières) au démarrage.

### Développement local

Base de données (Postgres exposé en local) :

```bash
docker run -d --name scht-db-dev \
  -e POSTGRES_DB=scht -e POSTGRES_USER=scht -e POSTGRES_PASSWORD=scht_password \
  -p 5432:5432 postgres:16-alpine
```

Backend :

```bash
cd backend
cp .env.example .env   # ou crée un .env avec DATABASE_URL / JWT_SECRET / PORT
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev            # → http://localhost:4000
```

Frontend :

```bash
cd frontend
npm install
npm run dev            # → http://localhost:5173
npm test               # lance les tests Vitest
```

---

## Structure du projet

```
backend/
├── prisma/
│   ├── schema.prisma        # User, Ship, Location, Resource, Mission, CargoLine (+ enum CargoStatus)
│   └── seed.ts              # vaisseaux, lieux Stanton, matières
└── src/
    ├── server.ts
    ├── middleware/auth.ts
    └── routes/              # auth, locations, resources, missions

frontend/src/
├── App.tsx                  # routes (accueil → Dashboard)
├── lib/
│   ├── api.ts               # client API
│   ├── route.ts             # buildRoute + logique de verrouillage (testé)
│   └── stats.ts             # agrégats du dashboard (testé)
├── store/                   # Zustand : missions, listes, vaisseau, route, auth
├── styles/cargo-terminal.css
├── components/
│   ├── layout/NavBar.tsx
│   ├── route/               # StopCard, Clamp, CapacityGauge
│   └── dashboard/           # KpiTiles, ContributionGrid, InProgressList, TopBreakdown
└── pages/                   # Dashboard, Home (Route), Missions, Settings, Info, Login
```

---

## Système Stanton

Import en un clic depuis les Réglages des lieux d'échange connus de Stanton :

| Planète | Lieux clés |
|---|---|
| Hurston | Lorville, Everus Harbor, HUR-L1/L2/L3/L4/L5, Arial, Aberdeen, Magda, Ita |
| Crusader | Orison, CRU-L1/L4/L5, GrimHex, Yela, Cellin, Daymar |
| ArcCorp | Area18, Baijini Point, ARC-L1/L2/L4/L5, Lyria, Wala |
| microTech | New Babbage, Port Tressler, MIC-L1/L2/L3/L4/L5, Calliope, Clio, Euterpe |
