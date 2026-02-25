# AGENTS.md

## Cursor Cloud specific instructions

### Overview
travelWeb is a Nuxt 3 SPA (client-side only, `ssr: false`) for planning travel itineraries with Mapbox maps. No backend, no database — all state lives in browser `localStorage`.

### Prerequisites
- **Bun** is the package manager (lockfile: `bun.lock`). Install via `curl -fsSL https://bun.sh/install | bash`.
- A valid `VITE_MAPBOX_TOKEN` must be in `.env` for the map and place search to work. Copy from `.env.example` or set via environment secrets.

### Key commands
| Task | Command |
|------|---------|
| Install deps | `bun install` (runs `nuxt prepare` via postinstall) |
| Dev server | `bun run dev` (serves at `http://localhost:3000/travelWeb/`) |
| Lint | `bun run lint` |
| Lint fix | `bun run lint:fix` |
| Tests | `bun run test` |
| Tests (watch) | `bun run test:watch` |
| Coverage | `bun run test:coverage` |

### Gotchas
- The app's `baseURL` is `/travelWeb/`, so the dev server root is `http://localhost:3000/travelWeb/`, not just `/`.
- Tests mock `fetch`, `localStorage`, and `crypto.randomUUID` in `tests/setup.ts` — they do **not** require a real Mapbox token or network access.
- ESLint config at `eslint.config.mjs` imports from `.nuxt/eslint.config.mjs`, so `nuxt prepare` (or `bun install`) must run before linting works.
- The `.npmrc` sets `legacy-peer-deps=true`.
