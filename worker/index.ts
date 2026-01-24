import { Redis } from "@upstash/redis";


import {
  getCacheKey,
  validateInput,
  resolveCoords,
  buildWeatherHeaders,
  extractForecastUrl,
} from "./lib";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Worker fetch handler for POST /api/weather.
 *
 * Validates input with `InputSchema`, resolves latitude/longitude from
 * provided coordinates, ZIP (Zippopotam.us) or address (Census geocoder),
 * then queries weather.gov for a forecast. If Upstash Redis is configured,
 * responses are cached for 1 hour and served from cache when available.
 *
 * Accepts an optional `X-User-Email` request header containing a developer
 * contact email. When present and a valid email address, the header is
 * validated and propagated to upstream weather.gov requests as `X-User-Email`.
 */
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/weather" && request.method === "POST") {
      const raw = await request.json().catch(() => null);
      const input = validateInput(raw);
      if (!input) {
        return jsonResponse({ error: "Invalid input" }, 400);
      }

      const hasCoords =
        typeof (input as { lat?: unknown }).lat === "number" &&
        typeof (input as { lon?: unknown }).lon === "number";
      const zipVal = (input as { zip?: unknown }).zip;
      const hasZip =
        typeof zipVal === "string" && zipVal.trim().length > 0;
      const addressVal = (input as { address?: unknown }).address;
      const hasAddress =
        typeof addressVal === "string" && addressVal.trim().length > 0;

      if (!hasCoords && !hasZip && !hasAddress) {
        return jsonResponse({ error: "Location is required" }, 400);
      }
      const cacheKey = getCacheKey(input);

      let redis: Redis | null = null;
      try {
        type UpstashEnv = Env & {
          UPSTASH_REDIS_REST_URL?: string;
          UPSTASH_REDIS_REST_TOKEN?: string;
        };
        const e = env as UpstashEnv;
        if (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN) {
          redis = new Redis({
            url: e.UPSTASH_REDIS_REST_URL,
            token: e.UPSTASH_REDIS_REST_TOKEN,
          });
        }
      } catch {
        redis = null;
      }

      try {
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return jsonResponse({ source: "cache", data: cached });
          }
        }
      } catch {
        // ignore cache errors and continue
      }

      const coords = await resolveCoords(input, fetch);
      if (!coords) {
        return jsonResponse({ error: "Unable to resolve location" }, 400);
      }
      const { lat, lon } = coords; 

      try {
        const headers = buildWeatherHeaders(request.headers.get("x-user-email") ?? undefined);

        const pointsRes = await fetch(
          `https://api.weather.gov/points/${lat},${lon}`,
          { headers },
        );
        if (!pointsRes.ok) {
          return jsonResponse(
            { error: `weather API error (${pointsRes.status})` },
            502,
          );
        }
        const points = await pointsRes.json();
        const forecastUrl = extractForecastUrl(points);
        if (!forecastUrl) {
          return jsonResponse({ error: "no forecast available" }, 502);
        }
        const forecastRes = await fetch(forecastUrl, { headers });
        if (!forecastRes.ok) {
          return jsonResponse(
            { error: `forecast fetch failed (${forecastRes.status})` },
            502,
          );
        }
        const forecast = await forecastRes.json();

        try {
          if (redis) {
            await redis.set(cacheKey, forecast, { ex: 60 * 60 });
          }
        } catch {
          // ignore cache error
        }

        return jsonResponse({ source: "remote", data: forecast });
      } catch {
        return jsonResponse(
          { error: "unexpected error fetching forecast" },
          500,
        );
      }
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
