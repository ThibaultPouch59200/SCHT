# Refonte front — « Cargo Terminal » : routing multi-mission

**Date :** 2026-07-04
**Statut :** design validé, en attente de relecture

---

## 1. Contexte et objectif

L'app (SC Hauling Tracker) traçait des missions de fret via un formulaire lourd
(origine unique, système, paiement, lignes de cargo, barre de capacité,
autocomplete, templates) et une page d'accueil qui listait les livraisons
groupées par planète. Deux problèmes :

1. Le formulaire de saisie de mission est trop complexe.
2. Le vrai besoin — **planifier une tournée à travers plusieurs missions**
   (Récup A → Dépose B → Récup B → Dépose C…) — n'était pas supporté : une
   mission n'avait qu'un seul point de récupération.

**Objectif de cette refonte (d'un seul bloc, tous les écrans) :**

- Passer à un modèle où une mission porte **plusieurs récupérations ET plusieurs
  livraisons** (l'origine descend au niveau de chaque cargaison).
- Un écran **Route** central : une tournée ordonnée d'arrêts, regroupés par
  station, avec la règle qu'**une livraison est verrouillée tant que sa
  récupération n'est pas faite**.
- Simplifier radicalement la saisie de mission (un seul tableau de cargaisons).
- **Supprimer toute la gestion d'argent** (paiement, portefeuille, transactions,
  page Finance).
- Une identité visuelle distinctive : **Cargo Terminal** (écran de docking
  industriel), pour sortir des looks « dashboard généré par IA ».

### Non-objectifs (hors périmètre)

- Optimisation « plus court chemin » réelle : on n'a pas de coordonnées/distances
  entre stations. L'ordre auto est un regroupement, pas une optimisation TSP.
- Livraisons partielles en SCU (aujourd'hui `DeliveredAmount.amount`) : on passe
  à un suivi binaire par cargaison (voir §8, décision à confirmer).
- Multi-système avancé : le champ « système » disparaît du formulaire ; le
  système/la planète d'une station proviennent de sa fiche `Location`.

---

## 2. Identité visuelle — « Cargo Terminal »

Direction sombre, industrielle, ancrée dans le fret spatial (manifestes, codes de
conteneurs, terminaux de docking, unités SCU). Elle remplace le thème
terracotta/ardoise actuel. **Aucun rail timeline** (ronds numérotés reliés par un
trait) — la séquence est portée par des blocs-index stencilés.

### Palette (dark, primaire)

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#0e1116` | fond page |
| `--panel` | `#161b22` | cartes, barres |
| `--panel-2` | `#1c222c` | fonds secondaires, index |
| `--edge` | `#2a323f` | bordures, séparateurs |
| `--amber` | `#f2a83b` | signal « charge / récup », accent interactif primaire |
| `--steel` | `#6ea8bf` | signal « dépôt / livraison » |
| `--ok` | `#7bb366` | fait / validé |
| `--halt` | `#e06b5c` | verrouillé, surcharge, danger (hazard-stripe) |
| `--txt` | `#e6e9ee` | texte principal |
| `--dim` | `#8b94a3` | texte secondaire |
| `--faint` | `#565f6e` | labels, méta |

Amber + steel forment un **système de signal fonctionnel** (charge vs dépôt), pas
un simple accent unique — c'est ce qui évite le défaut « accent néon sur noir ».

### Thème clair

**Décision (à confirmer, §8) :** dark-only. L'esthétique « cockpit / terminal »
est intrinsèquement sombre ; une variante claire la dilue. On retire donc le
toggle de thème actuel. *(Alternative si l'utilisateur veut garder le toggle :
décliner une variante claire « steel paper ».)*

### Typographie

| Rôle | Police | Usage |
|---|---|---|
| Display | **Oswald** (condensée, majuscules, `letter-spacing`) | titres, nav, boutons, noms de station |
| Data / mono | **JetBrains Mono** | codes station, SCU, gauges, labels techniques |
| Corps | **Barlow** | textes courants, descriptions |

Polices chargées via `@fontsource/*` (bundle local, pas de CDN externe) pour
rester cohérent avec un build Vite hors-ligne.

### Composants signature

- **Bloc-index de station** : colonne à gauche de chaque arrêt, code station mono
  (`EVR`, `TRS`, `BAB`) + `LEG 0X`. Porte l'ordre visuellement.
- **Clamp** (checkbox carrée façon verrou magnétique) pour cocher charge/dépôt.
- **Hazard-stripe** (bande rayée `--halt`) au-dessus d'une ligne verrouillée.
- **Gauge segmentée** (cellules mono) pour la capacité de soute, au lieu d'une
  barre lisse.
- **Dividers « SAUT QUANTIQUE VERS <planète> »** entre groupes de planètes.

Les maquettes validées sont dans `.superpowers/brainstorm/` (route + formulaire).

---

## 3. Modèle de données

### 3.1 Prisma (`backend/prisma/schema.prisma`) — migration

**Retiré :**
- `User.wallet`
- `Mission.originId`, `Mission.origin`, `Mission.system`, `Mission.pay`
- `Location.missions` (relation `MissionOrigin`)
- modèle `Transaction`, `User.transactions`
- modèle `DeliveredAmount` (remplacé, voir plus bas)

**Modifié — `CargoLine`** gagne son origine et un statut :

```prisma
model CargoLine {
  id         Int       @id @default(autoincrement())
  missionId  Int
  resourceId Int
  scu        Float
  originId   Int       // NOUVEAU — lieu de récupération
  destId     Int       // lieu de livraison (inchangé)
  status     CargoStatus @default(PENDING) // NOUVEAU
  mission    Mission   @relation(fields: [missionId], references: [id], onDelete: Cascade)
  resource   Resource  @relation(fields: [resourceId], references: [id])
  origin     Location  @relation("CargoLineOrigin", fields: [originId], references: [id])
  dest       Location  @relation("CargoLineDest",   fields: [destId],   references: [id])
}

enum CargoStatus {
  PENDING    // ni chargé ni livré
  LOADED     // récupéré, en soute
  DELIVERED  // déposé à destination
}
```

**`Mission`** devient un simple regroupement :

```prisma
model Mission {
  id          Int         @id @default(autoincrement())
  userId      Int
  createdAt   DateTime    @default(now())
  completedAt DateTime?
  user        User        @relation(fields: [userId], references: [id])
  cargos      CargoLine[]
}
```

`Location` référence désormais les cargaisons par deux relations
(`CargoLineOrigin`, `CargoLineDest`). `Mission.completedAt` est posé quand toutes
ses cargaisons sont `DELIVERED`.

**Migration destructive** (dev, pas de données de prod à préserver) : une nouvelle
migration Prisma qui supprime les colonnes/tables money + `DeliveredAmount`,
ajoute `originId`/`status`. Comme `originId` est requis, la migration se fait sur
base vide (ou avec un `originId` par défaut temporaire puis nettoyage).

### 3.2 Types front (`frontend/src/types/index.ts`)

```ts
export type CargoStatus = 'PENDING' | 'LOADED' | 'DELIVERED';

export interface CargoLine {
  id?: number;
  res: string;
  scu: number;
  origin: string;       // NOUVEAU : station de récup
  originPlanet: string; // dérivé de la fiche Location
  dest: string;
  planet: string;       // planète de la station de livraison
  status: CargoStatus;
}

export interface Mission {
  id: number;
  cargos: CargoLine[];
  createdAt: string;
  completedAt?: string;
}
// Ship inchangé. Transaction supprimé.
```

### 3.3 API (`backend/src/routes/missions.ts`, `frontend/src/lib/api.ts`)

- `finance.ts` (routes) et `api.finance.*` : **supprimés**.
- `POST /api/missions` — payload : `{ cargos: { res, scu, origin, dest }[] }`
  (plus d'`origin`/`system`/`pay` au niveau mission). Le backend résout/crée les
  `Location` (origin + dest) et `Resource` comme aujourd'hui.
- Suivi de statut — remplace `setDelivered`/`confirmStation` :
  - `PATCH /api/missions/:missionId/cargo/:cargoId/status` → `{ status }`.
  - `POST /api/missions/:missionId/stations/:station/confirm?op=load|drop` :
    coche en masse toutes les cargaisons d'une station pour l'opération donnée.
- `copy`/`replay` conservés (dupliquer une mission), sans `pay`.

---

## 4. Écrans

Navigation (top bar Cargo Terminal) : **Route · Missions · Journal · Réglages**.
`Finance` retiré. `Info` : conservé, accessible via une icône dans la top bar.
`LoginPage` : re-skiné Cargo Terminal, logique d'auth inchangée.

### 4.1 Route (remplace `Home.tsx`)

Écran opérationnel principal. Construit une **tournée d'arrêts** à partir de
toutes les cargaisons non livrées de toutes les missions actives.

- **Un arrêt = une station.** Il agrège ce qu'on y **▲ charge** (cargaisons dont
  `origin` = station) et ce qu'on y **▼ dépose** (cargaisons dont `dest` = station).
- Chaque ligne a un **clamp** pour cocher : cocher une charge → `LOADED` ; cocher
  un dépôt → `DELIVERED`.
- **Verrouillage :** une ligne de dépôt est grisée + barrée + hazard-stripe tant
  que sa cargaison n'est pas `LOADED`. Un indice pointe la station de récup
  (`⊘ VERROUILLÉ — CHARGER À <code> / LEG NN`). Le clamp est inactif.
- **Gauge de soute** en tête : SCU des cargaisons `LOADED` non encore livrées vs
  capacité du vaisseau sélectionné ; passe en `--halt` si surcharge.
- **Toggle « AUTO »** (ordre auto on/off) — voir §5.
- Arrêt entièrement traité → replié/atténué.

### 4.2 Missions (remplace `Missions.tsx`)

- **Formulaire simplifié** : un seul tableau de cargaisons, colonnes
  `Commodité · SCU · ▲ Charge (station) · ▼ Dépôt (station)`. Les champs station
  utilisent `ComboSelect` (choisir/créer) ; la planète/le système sont dérivés de
  la `Location` choisie. Gauge segmentée : soute déjà engagée (ambre pâle) + cette
  mission (ambre plein). `+ Ajouter une cargaison`, `Enregistrer`, `Annuler`.
  Plus de paiement, plus de système, plus de bloc « Options ».
- **Liste des missions actives** : carte par mission listant ses cargaisons
  (origine → destination, SCU, statut). Actions : Copier, Supprimer.

### 4.3 Journal (remplace `History.tsx`)

Missions terminées (`completedAt` non nul). Re-skin Cargo Terminal. **Sans aucune
donnée financière** : on affiche date, nb d'arrêts, SCU total livré, stations
desservies. Possibilité de « rejouer » (copier) une mission passée.

### 4.4 Réglages (remplace `Settings.tsx`)

Inchangé fonctionnellement, re-skiné : gestion des `Location` (nom, planète,
système), des `Resource`, sélection du vaisseau, import des 35 lieux de Stanton.
On retire tout ce qui touchait au portefeuille.

---

## 5. Ordre de la route et logique de verrouillage

### Verrouillage (toujours actif, indépendant de l'ordre)

Une cargaison suit `PENDING → LOADED → DELIVERED`. Dans l'écran Route, une action
de **dépôt** n'est cochable que si la cargaison est `LOADED`. C'est la garantie de
cohérence : on ne peut pas livrer une cargaison non chargée, quel que soit l'ordre
des arrêts affiché.

### Ordre auto (toggle ON, défaut)

Regroupe les cargaisons en arrêts (clé = station) puis ordonne :

1. Tri par **système**, puis **planète**, puis **nom de station** (alphabétique).
   Regroupe géographiquement pour minimiser les sauts, sans prétendre optimiser.
2. Les dividers « SAUT QUANTIQUE VERS <planète> » marquent les changements de
   planète.
3. La numérotation `LEG 0N` suit l'ordre affiché.

Le verrouillage fait le reste : si une station est visitée « trop tôt » pour un
dépôt, la ligne reste verrouillée jusqu'à la charge correspondante.

### Ordre manuel (toggle OFF)

L'utilisateur **réordonne les arrêts** (drag & drop, ou flèches ↑/↓ si le DnD est
jugé trop coûteux — voir §8). L'ordre manuel est persistané (par utilisateur).
Le verrouillage s'applique de la même façon.

---

## 6. État (stores Zustand)

- `useMissionStore` : adapté au nouveau modèle (cargaisons avec `origin` +
  `status`), nouvelles actions `setCargoStatus`, `confirmStationOp`. La logique
  d'auto-complétion de mission bascule sur « toutes cargaisons `DELIVERED` ».
  Retrait de l'appel `recordMissionEarning`.
- `useFinanceStore` : **supprimé**.
- `useListsStore`, `useShipStore`, `useAuthStore` : conservés (retrait des bouts
  liés à l'argent/`wallet`).
- Nouveau : ordre de route manuel + toggle auto (dans `useMissionStore` ou un
  petit `useRouteStore`), persisté en `localStorage`.

---

## 7. Découpage de l'implémentation (indicatif — détaillé dans le plan)

1. **Backend** : schéma Prisma + migration, routes missions (statut, origine
   par cargo), suppression finance.
2. **Contrat API + types + stores** front.
3. **Design system** : tokens CSS Cargo Terminal, polices, composants de base
   (clamp, gauge, bloc-index, top bar/nav).
4. **Écran Route** (construction de la tournée, verrouillage, auto/manuel).
5. **Écran Missions** (formulaire simplifié + liste).
6. **Journal + Réglages + Login/Info** re-skin.
7. Retrait des morts (Finance, thème clair si dark-only confirmé).

---

## 8. Décisions par défaut à confirmer en relecture

1. **Suivi binaire** des cargaisons (`PENDING/LOADED/DELIVERED`) plutôt que
   livraisons partielles en SCU. *Reco : oui, ça colle aux maquettes (clamps).*
2. **Dark-only** : on retire le toggle de thème clair. *Reco : oui.*
3. **Réordonnancement manuel** : drag & drop vs flèches ↑/↓. *Reco : flèches
   d'abord (plus simple, mobile-friendly), DnD plus tard.*
4. **Codes station** (`EVR`, `TRS`…) : générés (3 premières lettres / acronyme)
   ou saisis dans la fiche Location ? *Reco : générés automatiquement, non
   éditables pour l'instant.*
5. **Migration destructive** sur base de dev (pas de préservation de données).
   *Reco : oui.*
```
