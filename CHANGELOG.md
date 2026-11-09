# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-11-09

Live at https://kinklist.hypno-kink.org

### Changed

- Updated all dependencies, including React 19.3, Vite 8.3, Vitest 5,
  jsdom 31 and react-i18next 18. `bun audit` now reports no known
  vulnerabilities (previously 124).
- The template editor (Monaco) is bundled with the app instead of being
  loaded from a public CDN. The app no longer makes requests to third-party
  servers.
- The app version is injected at build time instead of bundling
  `package.json`.
- Phone layout: the legend wraps instead of scrolling sideways, and the
  Export/Import buttons sit side by side.
- Better page metadata: description, Open Graph tags, light/dark theme
  color, canonical URL and a cleaned-up web manifest.
- Deploy workflows (FTPS) can be started manually and run one combined
  check (format, lint, tests, build) before uploading.
- CI runs a dependency audit on every pull request.
- Bun 1.4.4 is the pinned package manager.

### Fixed

- Shortcut hints in the editor and comment dialog showed German "Strg" in
  every language and named a non-existent `Strg+K` shortcut. They are now
  localized and show `Ctrl+Space` for autocomplete.
- `Cmd+Enter` saves on macOS (previously only `Ctrl+Enter`).
- Keyboard focus is visible again on buttons, links and form fields.
- `tsc -b` no longer writes `vite.config.js` / `.d.ts` files into the
  repository.

### Added

- Support for `prefers-reduced-motion`.
- `bun run check` runs everything CI runs.
- This changelog.

### Removed

- Unused dependencies: all CodeMirror/Lezer packages, `axios`,
  `html2canvas`.
- Unused components and files: `AdvancedExport`, `FixOverlay`,
  `I18nKinklistProvider`, the old `KinkListEditor`, `App.css`,
  `src/logo.svg`, Create React App leftovers and the manual FTP helper
  scripts in `scripts/`.

[1.2.0]: https://github.com/Kink-Development-Group/hypno-kinklist/compare/eedb000...v1.2.0
