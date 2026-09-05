# Running this project

Vite 7 + React 19 + TypeScript. Static SPA, no backend, no env vars.

## Uncommitted artifacts a fresh checkout needs

1. Install dependencies with **pnpm** (the repo ships `pnpm-lock.yaml`):

   ```
   pnpm install
   ```

   Nothing else. There is no `.env` / `.env.local` to copy — the app reads no
   environment variables, and every asset it needs is committed under `public/`.

## Running the dev server

Default port is Vite's 5173. Bind explicitly to `127.0.0.1`: with the default
host, Vite listens on `::1` only and IPv4 loopback clients get connection
refused.

```
npm run dev -- --port 5173 --strictPort --host 127.0.0.1
```

Detached on Windows (PowerShell), for a preview that outlives the shell —
stdout and stderr must go to two different files:

```
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','--port','5173','--strictPort','--host','127.0.0.1' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

If 5173 is taken, pass another free port to both `--port` and the URL you
register; nothing in the config hardcodes it.

## Other commands

| Command | What it does |
| --- | --- |
| `pnpm build` | `tsc -b` then `vite build` into `dist/` |
| `pnpm preview` | serves the built `dist/` (default port 4173) |
| `pnpm test` | node:test suites in `src/lib/*.test.ts` |
