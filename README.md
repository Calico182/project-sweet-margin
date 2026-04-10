# Sweet Margins

Sweet Margins is a Nuxt app for bakers who need to calculate recipe costs and set pricing with confidence.

## What the app does today

- **Landing page** with product messaging and quick links to the calculator and pantry.
- **Recipe calculator** to build recipes, estimate costs, and save/load/delete recipes.
- **Pantry manager** to maintain a master ingredient list with pricing, waste defaults, and price history.
- **Recipe URL parsing API** (`POST /api/recipe/parse`) that fetches a public recipe page and extracts ingredient lines with lightweight NLP parsing.
- **Dark mode toggle** persisted in browser storage.

## Current feature overview

### Calculator

- Build a recipe with ingredient rows (`name`, `quantity`, `unit`, `waste %`).
- Set business inputs:
  - servings
  - labor hours and hourly rate
  - fixed overhead and overhead percentage
  - target profit percentage
- Calculates:
  - ingredient cost
  - labor cost
  - overhead cost
  - base cost
  - profit amount
  - total selling price
  - per-serving cost and per-serving price
- Save recipes to local storage and reload them later.

### Pantry

- Central ingredient catalog with:
  - pack/unit quantity and unit
  - unit price
  - default waste percentage
  - status and trend indicators
- Sync new ingredients from saved recipes.
- Track ingredient price history (up to recent entries retained by code).
- Remove ingredients and inspect item history.

### Recipe parsing API

- Endpoint: `POST /api/recipe/parse`
- Input body:
  - `url` (required, public `http/https` URL)
  - `unitSystem` (`metric` or `imperial`)
- Behavior:
  - blocks localhost/private-style loopback URLs
  - fetches source HTML
  - extracts title + JSON-LD recipe ingredients when available
  - falls back to `<li>` extraction
  - parses ingredient lines into normalized quantity/unit/name with confidence scores
- Response includes:
  - parsed ingredients
  - original lines
  - inferred servings and total time when available
  - low-confidence warnings

## Tech stack

- Nuxt 4
- Vue 3 + Vue Router
- TypeScript
- `h3` server routes (via Nuxt server API)
- Browser localStorage persistence

## Project structure (high level)

- `app/pages/index.vue` - landing page
- `app/pages/calculator.vue` - calculator workflow
- `app/pages/pantry.vue` - pantry/master ingredient management
- `app/composables/useRecipeCalculator.ts` - reactive summary calculation
- `app/composables/useRecipeStorage.ts` - recipe persistence
- `app/composables/useMasterIngredients.ts` - pantry persistence and sync logic
- `app/utils/costing.ts` - core costing/unit conversion logic
- `server/api/recipe/parse.post.ts` - recipe parse API endpoint
- `server/utils/ingredientNlp.ts` - ingredient parsing/NLP helpers

## Local setup

### Requirements

- Node `^20.19.0` or `>=22.12.0`

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Data persistence

Data is currently browser-local only:

- Recipes: `sweet-margins-recipes-v1`
- Pantry items: `sweet-margins-master-ingredients-v1`
- Theme preference: `sweet-margins-theme`

No backend database or authentication is implemented yet.

## Known limitations (current state)

- Data is per-browser and per-device (no account sync).
- Ingredient matching is name-based; inconsistent naming can reduce matching quality.
- Density conversion is only implemented for a small set of ingredients.
- Recipe URL parsing is heuristic and may fail on some sites.
- No automated test suite has been added yet.