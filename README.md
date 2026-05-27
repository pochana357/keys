# keys

## Warcraft Logs CLI

Use the CLI helper to fetch Warcraft Logs v1 data outside the UI. It reads
`WCL_API_KEY` from `.env` and redacts the key in all printed URLs.

### Doctor mode

`doctor` reproduces the app's current pull fetch path: validate the key, fetch
report fights, select a pull, then fetch `damage-taken`, `casts`, `buffs`, and
`debuffs`.

```bash
npm run wcl:fetch -- doctor --url "http://localhost:5173/?code=RMK6vq912F4xVTPN&fight=8&pull=6"
```

The old no-subcommand form still works as an alias for `doctor`:

```bash
npm run wcl:fetch -- --code RMK6vq912F4xVTPN --fight 8 --pull 6
```

The `--url` option only parses `code`, `fight`, and `pull` from the query
string; it does not request `localhost` or require a Vite dev server. The
`fight` and `pull` values are the app's zero-based indexes.

### Fetch report fights

Fetch `GET /v1/report/fights/{code}` as JSON. Use `npm run --silent` when
reading JSON from stdout so npm does not print its script banner first:

```bash
npm run --silent wcl:fetch -- fights --code RMK6vq912F4xVTPN
```

Write the JSON to a file:

```bash
npm run wcl:fetch -- fights --code RMK6vq912F4xVTPN --out tmp/fights.json
```

### Fetch report events

Fetch one event endpoint with an explicit report-relative time range:

```bash
npm run --silent wcl:fetch -- events --type damage-taken --code RMK6vq912F4xVTPN --start 5357834 --end 5576773
```

Or derive `start` and `end` from the app's pull selection:

```bash
npm run wcl:fetch -- events --type casts --url "http://localhost:5173/?code=RMK6vq912F4xVTPN&fight=8&pull=6"
```

Supported event types are `damage-taken`, `casts`, `buffs`, and `debuffs`.
Paginated responses are merged into one JSON array of raw Warcraft Logs events.
Use `--filter "..."` to pass a Warcraft Logs event filter, and use `--out path`
to write the JSON to a file.

Exit codes:

- `0`: all requested fetches completed.
- `1`: invalid arguments or missing `WCL_API_KEY`.
- `2`: Warcraft Logs returned a non-OK API response.
- `3`: selected fight or pull index is out of range.
