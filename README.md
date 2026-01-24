# Simple-Weather

A minimal web app that fetches U.S. National Weather Service forecasts (via api.weather.gov) for a provided location. The project demonstrates a small full-stack setup using a Vite + React frontend and a Cloudflare Worker backend. It includes a local SRH (Serverless Redis HTTP) option for Redis-backed caching and an option to use Upstash for remote Redis in production-like environments.

Features

- Query NWS Weather.gov points API and display a three-day forecast.
- Server-side caching using Redis (local SRH or Upstash).
- `X-User-Email` header propagation: client sends configured email on requests, Worker forwards it to upstreams (e.g., weather.gov).
- Local development helper tasks (`task dev`, `task env-setup`, `task ensure-srh`) to start required services and the dev server.

## Prerequisites

- Node.js (recommended LTS) and npm
- Docker Desktop (needed to run SRH locally)
- Task (Taskfile runner) — https://taskfile.dev/ (this repository includes `Taskfile.yml`)
- PowerShell (Windows) or a POSIX-compatible shell (macOS/Linux) for interactive setup scripts

## Environment variables

Create `.env.local` (or run `task env-setup` to generate it). Important variables:

- `ENV_MODE`: `srh` (local SRH) or `upstash`
- SRH (local) variables: `SRH_MODE`, `SRH_TOKEN`, `SRH_CONNECTION_STRING`, `SRH_PORT`
- Upstash variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `EMAIL`: contact email used for requests
- `VITE_EMAIL`: mirrored `EMAIL` value exposed to the client (used to send `X-User-Email`)

> Note: Vite only exposes env variables to the client if they are prefixed with `VITE_` (we mirror `EMAIL` to `VITE_EMAIL` automatically when running `task env-setup`).

## Quick start

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` interactively

```bash
task env-setup
```

- On Windows this runs `setup-env.ps1`, on macOS/Linux it runs `setup-env.sh`.
- Choose `ENV_MODE=srh` for local development and provide an `EMAIL` when prompted (this sets `VITE_EMAIL` too).

3. Start development server (ensures SRH when `ENV_MODE=srh`)

```bash
task dev
```

4. Open the app (default Vite host: `http://localhost:5173`) and perform searches. The client sends `X-User-Email` and the worker forwards it to upstreams.

## Useful Tasks

- `task env-setup` — create/update `.env.local` (runs an OS-specific script)
- `task ensure-srh` — ensures the configured backend is ready (starts local SRH when `ENV_MODE=srh`)
- `task dev` — ensures SRH and runs the Vite dev server
- `task stop-srh` — stops and removes the local SRH container
- `task logs-srh` — follow SRH container logs

## Testing

Run unit and integration tests using Vitest:

```bash
npm test
```

## Deployment

Build and deploy using the existing npm scripts. Worker and static build steps:

```bash
npm run build
npm run deploy
```

## Notes & Troubleshooting

- If SRH doesn't start, run `task logs-srh` to inspect container output.
- Ensure `EMAIL`/`VITE_EMAIL` is set (client will include `X-User-Email`).
- If using Upstash, confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present in `.env.local`.
