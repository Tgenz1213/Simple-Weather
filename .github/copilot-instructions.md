## Purpose

This file gives concise, actionable guidance for AI coding agents working on Simple-Weather.
Follow these notes to be immediately productive: architecture, workflows, conventions, and safe edit boundaries.

## Big Picture

- **Frontend:** Vite + React + TypeScript lives in the `src/` folder. Entry: [src/main.tsx](../src/main.tsx). Main UI in [src/App.tsx](../src/App.tsx).
- **Worker:** A Cloudflare Worker lives in `worker/` and is wired via [wrangler.jsonc](../wrangler.jsonc) with `main: "worker/index.ts"`.
- **Build/Deploy:** `tsc -b` (type-check / project refs) runs before `vite build`; deployment uses `wrangler`.

## Important Files

- Frontend entry: [src/main.tsx](../src/main.tsx)
- Main app: [src/App.tsx](../src/App.tsx)
- Worker: [worker/index.ts](../worker/index.ts)
- Vite config: [vite.config.ts](../vite.config.ts)
- Wrangler config: [wrangler.jsonc](../wrangler.jsonc)
- Generated worker types: [worker-configuration.d.ts](../worker-configuration.d.ts) (do not edit manually)

## Developer Workflows (commands)

- Start dev server (HMR): `npm run dev`
- Full production build: `npm run build` (runs `tsc -b && vite build`)
- Deploy to Cloudflare: `npm run deploy`
- Generate/refresh worker types: `npm run cf-typegen`
- Detect unused exports: `npm run knip`

## Patterns & Conventions

### 1. Code Documentation (TSDoc)

All public-facing functions, interfaces, and complex logic must use TSDoc.

**STRICT RULE:** Eliminate "Narrative Noise." Do not include personal anecdotes, commentary on previous "broken" states, or conversational filler. Comments must be strictly technical, concise, and focused on the "how" and "what" of the implementation.

```typescript
/**
 * Fetches weather data for a given coordinate.
 * @param lat - Latitude in decimal degrees.
 * @param lon - Longitude in decimal degrees.
 * @returns A promise resolving to the WeatherResponse object.
 */
async function getForecast(lat: number, lon: number): Promise<WeatherResponse> { ... }
```

### 2. Structured Block Commenting & Region Grouping

Organize files using specific region tags and block headers to maintain a clean, navigable structure.

```typescript
// #region Types
/**
 * ****************************************************************************
 * DATA MODELS
 * Core interfaces for weather data structures.
 * ****************************************************************************
 */
export interface WeatherProps {
  temp: number;
}
// #endregion

/**
 * ****************************************************************************
 * UI COMPONENTS
 * Handles the rendering of weather cards and list items.
 * ****************************************************************************
 */
// #region Components
export const WeatherCard = () => { ... }
// #endregion
```

### 3. Explicit Type Documentation

Never rely solely on inference for complex objects. Explicitly type function parameters and return values to ensure the `tsc -b` step remains robust and documentation is clear. Avoid using `any` or implicit `unknown` types.

## Integration Points

- The frontend calls the worker API at `/api/` (see fetch in [src/App.tsx](../src/App.tsx)). Update [worker/index.ts](../worker/index.ts) to change the API responses.
- Worker typing: worker code uses `satisfies ExportedHandler<Env>` and relies on generated types in [worker-configuration.d.ts](../worker-configuration.d.ts).

## PR / Edit Guidelines for Agents

- **Dependency Management:** NEVER manually edit `package.json` to add, remove, or update dependencies. Always use the command line (e.g., `npm install <package>`) to ensure `package-lock.json` is synchronized and the environment remains stable.
- **Zero-Fluff Policy:** Delete "Copilot-style" narrative comments. If a comment doesn't explain _what_ the code does or _how_ to use it via TSDoc, it shouldn't be there.
- **Build Integrity:** Small fixes and feature work: edit `src/*` and `worker/*`, ensure `npm run build` passes locally.
- **No Manual Edits:** Do not change `worker-configuration.d.ts` or other generated outputs.

## Troubleshooting hints

- If builds fail, run `tsc -b` to surface type errors before investigating Vite bundling.
- `knip` can be used to find dead exports; ensure you aren't leaving "ghost" code behind.

## When in doubt

- Prefer minimal, focused changes with passing `npm run build` and `npm run lint`.
- Ensure all new logic is wrapped in appropriate `#region` tags and documented with TSDoc.
