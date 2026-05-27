# Developer Notes

This file documents the recommended workflow for developers and coding agents
working in this repository. It is intentionally about local development,
verification, and change hygiene rather than product behavior.

## Setup

Use npm for project commands. Install dependencies before running the app or
checks:

```bash
npm install
```

Human developers should start the Vite development server during normal UI
work:

```bash
npm run dev
```

Coding agents must not start the dev server themselves. If a local dev server
is needed for browser verification, ask the human user to start or reuse it and
provide the URL.

The dev server is usually the right loop while editing. Use a production build
only when you need to verify bundling, static output, or behavior that differs
from Vite's dev mode:

```bash
npm run build
npm run preview
```

## Checks

The check scripts are split by tool so failures are easier to read and rerun.
Use the narrowest command that matches the change while iterating, then run the
broader command before a larger change is ready for review.

### `npm run check`

Runs `svelte-check`, including Svelte and TypeScript diagnostics. Use it after
component changes, prop changes, store/reactivity changes, route changes, or
anything that may affect template type inference.

### `npm run check:format`

Runs Prettier in check-only mode. Use it when you want to verify formatting
without modifying files.

### `npm run check:lint`

Runs ESLint. Use it after TypeScript or Svelte edits, especially when touching
component markup, imports, reactive state, or Svelte-specific patterns.

### `npm run check:all`

Runs diagnostics, formatting, and lint checks in order. Use it when a change is
ready for review.

### `npm run format`

Writes Prettier formatting changes across the repository. Use it when you intend
to update files, not just verify them.

## Tests

Run the test suite with:

```bash
npm run test
```

Use watch mode while iterating on tests:

```bash
npm run test:watch
```

## Warcraft Logs API inspection

Use the `wcl:fetch` CLI to inspect Warcraft Logs API responses when tests or
fixtures need a better picture of real report data. See `README.md` for
commands and examples.

## Change Guidelines

- Keep commits scoped to one behavior or cleanup theme. Do not mix unrelated
  formatting, lint cleanup, and feature changes unless the change requires it.
