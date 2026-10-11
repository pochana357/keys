# Developer Notes

This file documents the recommended workflow for developers and coding agents
working in this repository. It is intentionally about local development,
verification, and change hygiene rather than product behavior.

## Setup

Use pnpm 11.3.0 for project commands, as pinned in `package.json`. Install
dependencies before running the app or checks:

```bash
pnpm install
```

Human developers should start the Vite development server during normal UI
work:

```bash
pnpm run dev
```

Coding agents must not start the dev server themselves. If a local dev server
is needed for browser verification, ask the human user to start or reuse it and
provide the URL.

The dev server is usually the right loop while editing. Use a production build
only when you need to verify bundling, static output, or behavior that differs
from Vite's dev mode:

```bash
pnpm run build
pnpm run preview
```

## Checks

The check scripts are split by tool so failures are easier to read and rerun.
Use the narrowest command that matches the change while iterating, then run the
broader command before a larger change is ready for review.

### `pnpm run check`

Runs `svelte-check`, including Svelte and TypeScript diagnostics. Use it after
component changes, prop changes, store/reactivity changes, route changes, or
anything that may affect template type inference.

### `pnpm run check:format`

Runs Prettier in check-only mode. Use it when you want to verify formatting
without modifying files.

### `pnpm run check:lint`

Runs ESLint. Use it after TypeScript or Svelte edits, especially when touching
component markup, imports, reactive state, or Svelte-specific patterns.

### `pnpm run check:all`

Runs diagnostics, formatting, and lint checks in order. Use it when a change is
ready for review.

### `pnpm run format`

Writes Prettier formatting changes across the repository. Use it when you intend
to update files, not just verify them.

## Tests

Run the test suite with:

```bash
pnpm run test
```

Use watch mode while iterating on tests:

```bash
pnpm run test:watch
```

## Warcraft Logs API inspection

Use the `wcl:fetch` CLI to inspect Warcraft Logs API responses when tests or
fixtures need a better picture of real report data. See `README.md` for
commands and examples.

## Change Guidelines

- Keep commits scoped to one behavior or cleanup theme. Do not mix unrelated
  formatting, lint cleanup, and feature changes unless the change requires it.
