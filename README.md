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

## Live

The app is published at **https://kinklist.hypno-kink.org**.

Deployment runs through GitHub Actions and FTPS:

| Branch | Workflow                            | Server folder        |
| ------ | ----------------------------------- | -------------------- |
| `main` | `.github/workflows/deploy-prod.yml` | `kinklist_hypno`     |
| `dev`  | `.github/workflows/deploy-dev.yml`  | `kinklist_hypno_dev` |

Each run checks formatting, lint, tests and build (`bun run check`) and then
mirrors `dist/` to the server. Both workflows can also be started manually
(_Actions → Run workflow_).

Required secrets (repository environments `Prod` / `Dev`): `FTP_HOST`,
`FTP_USER_PROD`, `FTP_PASS_PROD`, `FTP_USER_DEV`, `FTP_PASS_DEV`.

For the domain to work, the subdomain `kinklist.hypno-kink.org` must point to
the `kinklist_hypno` folder in the hosting panel (document root), with DNS for
`kinklist` pointing to the web server and a TLS certificate issued for it.

## Development

### Prerequisites

- [Bun](https://bun.sh) (version pinned in `package.json` / `mise.toml`)
- Node.js 20+ (used by some tooling)

### Install and run

```bash
bun install
bun run dev
```

### Quality checks

```bash
bun run check   # format check + lint + tests + production build
```

## Available scripts

- `bun run dev` / `bun start` - start the Vite dev server
- `bun run build` - type-check and build the production bundle into `dist/`
- `bun run preview` - serve the production build locally
- `bun run test` - run Vitest (`--run` for a single pass)
- `bun run test:coverage` - run tests with coverage
- `bun run lint` / `bun run lint:fix` - ESLint + Prettier checks
- `bun run format` / `bun run format:check` - format or verify formatting
- `bun run check` - everything CI runs before a deploy

## Project structure

- `src/App.tsx` - app shell, providers and lazy-loaded overlays
- `src/context/KinklistContext.tsx` - central kinklist state, hash sync and local draft persistence
- `src/components/` - UI building blocks, overlays, import/export dialogs and editor integration
- `src/components/editor/` - advanced template editor and Monaco helpers (Monaco is bundled locally, no CDN)
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

## Notes

- URL hash state remains the source of truth when a shared link is opened.
- Local draft persistence is meant as a convenience feature for the same browser/device.
- Heavy parts (editor, export/import dialogs, PDF export) are lazy-loaded and only downloaded when used.
- Ratings never leave the browser: state lives in the URL hash and in `localStorage`; no external requests are made.
