# TravelWeb

A client-side travel itinerary planner built with Nuxt 3, Mapbox, and Tailwind CSS. Plan multi-day trips by searching for places and organizing them on an interactive map — all data stays in your browser.

**Live:** [travel-web-sepia.vercel.app](https://travel-web-sepia.vercel.app/)

## Features

- Interactive Mapbox map with clustered markers and route lines between places
- Day-by-day itinerary planning with drag-and-drop reordering
- Place search powered by Mapbox Searchbox API
- Trip sharing via encoded URL (no server required)
- Export/import trips as JSON, formatted text, or print
- Weather widget, country flag detection, keyboard shortcuts
- Dark mode support
- Fully offline — all data stored in localStorage

## Tech Stack

Nuxt 3 (SPA) / Vue 3 / TypeScript / Tailwind CSS / Pinia / Mapbox GL / shadcn-vue

## Setup

```bash
bun install
```

Create a `.env` file with your Mapbox token:

```
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## Development

```bash
bun run dev
```

## Testing

```bash
bun run test        # unit & component tests (Vitest)
bun run test:e2e    # end-to-end tests (Playwright)
```

## Build

```bash
bun run build
```
