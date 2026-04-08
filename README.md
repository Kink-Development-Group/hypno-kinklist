# Hypno Kinklist

Modern React/Vite rewrite of the classic kinklist workflow with multilingual templates, rich import/export support, local draft recovery and shareable hash-based state.

## Highlights

- React 19 + TypeScript 6 + Vite 8
- Multilingual `.klist` templates with inline translation syntax like `+ [DE] ...`
- Theme switcher and language switcher (EN / DE / SV)
- Hash-based sharing for selections and comments
- Local draft recovery in `localStorage`
  - automatically restores the last local session
  - never overrides an existing URL hash
  - can be cleared from the footer
- Global modal-based error handling instead of blocking `alert()` popups
- Lazy-loaded heavy UI parts (`EditOverlay`, `InputOverlay`, comment modal, import/export modals) for a smaller initial bundle
- Advanced export/import flows for image and data formats

## Supported workflows

### Rating flow

- Open the selection overlay with **Start**
- Rate each kink with the available preference levels
- Add optional comments per field
- Share the current state through the URL hash

### Template editing

- Edit the active kink template in the editor overlay
- Work with classic and multilingual template syntax
- The app automatically falls back to the built-in enhanced template if the public default template is unavailable or not multilingual

### Import / export

Export supports the app's image and document/data flows, including formats used by the advanced export modal. Import supports the structured formats implemented in the app (`JSON`, `XML`, `CSV`).

## Development

### Prerequisites

- Node.js 20+ recommended
- npm works out of the box
- Bun can also be used (`packageManager` is set to `bun@1.3.11`)

### Install

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

The workspace also exposes `npm start`, which points to the same Vite dev server.

### Quality checks

```bash
npm run test -- --run
npm run lint
npm run build
```

## Available scripts

- `npm run dev` - start Vite in development mode
- `npm start` - alias for the dev server
- `npm run build` - type-check and build the production bundle
- `npm run preview` - preview the production build locally
- `npm run test` - run Vitest
- `npm run test:ui` - open the Vitest UI
- `npm run test:coverage` - run tests with coverage
- `npm run lint` - run ESLint + Prettier checks
- `npm run lint:fix` - apply automatic lint fixes
- `npm run format` - format source files with Prettier
- `npm run format:check` - verify formatting without changing files

## Project structure

- `src/App.tsx` - app shell, providers and lazy-loaded overlays
- `src/context/KinklistContext.tsx` - central kinklist state, hash sync and local draft persistence
- `src/components/` - UI building blocks, overlays, import/export dialogs and editor integration
- `src/components/editor/` - advanced template editor and Monaco/Codemirror helpers
- `src/utils/` - parsing, hash encoding, export helpers, template loading and browser persistence utilities
- `src/i18n/` - translation resources and i18next setup
- `public/defaultList/kinks.klist` - public default template loaded at runtime

## Template notes

The parser supports these primary prefixes:

- `#` category
- `()` field line
- `*` kink line
- `?` description line
- `+ [LANG]` translation line
- `//` comment line

If the loaded default template does not contain multilingual content, the app automatically switches to the built-in enhanced template.

## Recent implementation updates

- added local draft persistence with safe restore semantics
- replaced generic `alert()`-based error reporting with a reusable app-level modal flow
- split heavy overlays and modal dialogs into lazy-loaded chunks
- cleaned up noisy debug logging in the main runtime paths
- refreshed test setup to initialize i18n consistently
- rebuilt this README to match the current Vite-based architecture and feature set

## Notes

- URL hash state remains the source of truth when a shared link is opened.
- Local draft persistence is meant as a convenience feature for the same browser/device.
- The production build may still show plugin timing hints from the bundler, but the heavy UI chunks are now split out of the initial load.
