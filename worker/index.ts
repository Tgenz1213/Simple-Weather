import { z } from "zod";
import { Redis } from "@upstash/redis";

const InputSchema = z.object({
  zip: z.string().min(5).max(10).optional(),
  address: z.string().max(200).optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/weather" && request.method === "POST") {
      const raw = await request.json().catch(() => null);
      const parse = InputSchema.safeParse(raw);
      if (!parse.success) {
        return jsonResponse({ error: "Invalid input" }, 400);
      }
      const input = parse.data;

      // Build a cache key
      const cacheKey = `weather:${input.zip ?? input.address ?? `${input.lat},${input.lon}`}`;

      // init redis if available
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

      // Try cached
      try {
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return jsonResponse({ source: "cache", data: cached });
          }
        }
      } catch {
        // continue if cache fails
      }

      // Resolve lat/lon
      let lat: number | null = null;
      let lon: number | null = null;

      if (input.lat != null && input.lon != null) {
        lat = input.lat;
        lon = input.lon;
      } else if (input.zip) {
        // Use Zippopotamus for quick zip->latlon
        try {
          const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(input.zip)}`);
            if (res.ok) {
              const j = (await res.json()) as {
                places?: Array<{ latitude?: string; longitude?: string }>;
              };
              const place = j.places && j.places[0];
              if (place?.latitude && place?.longitude) {
                lat = Number(place.latitude);
                lon = Number(place.longitude);
              }
            }
        } catch {
          // continue on error
        }
      } else if (input.address) {
        // Use Census geocoder
        try {
          const q = encodeURIComponent(input.address);
          const res = await fetch(
            `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${q}&benchmark=Public_AR_Current&format=json`,
          );
          if (res.ok) {
            const j = (await res.json()) as {
              result?: {
                addressMatches?: Array<{
                  coordinates?: { x?: number; y?: number };
                }>;
              };
            };
            const coords = j.result && j.result.addressMatches && j.result.addressMatches[0];
            if (coords && coords.coordinates && typeof coords.coordinates.x === "number" && typeof coords.coordinates.y === "number") {
              lat = coords.coordinates.y;
              lon = coords.coordinates.x;
            }
          }
        } catch {
          // continue on error
        }
      }

      if (lat == null || lon == null) {
        return jsonResponse({ error: "Unable to resolve location" }, 400);
      }

      // Call weather.gov points API
      try {
        const headers = {
          // Weather.gov requires a User-Agent identifying the client; include an innocuous identifier.
          "User-Agent": "Simple-Weather (https://github.com/)",
          "Accept": "application/geo+json,application/json",
        } as Record<string, string>;

        const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers });
        if (!pointsRes.ok) {
          return jsonResponse({ error: `weather API error (${pointsRes.status})` }, 502);
        }
        const points = (await pointsRes.json()) as { properties?: { forecast?: string } };
        const forecastUrl = points.properties?.forecast;
        if (!forecastUrl) {
          return jsonResponse({ error: "no forecast available" }, 502);
        }
        const forecastRes = await fetch(forecastUrl, { headers });
        if (!forecastRes.ok) {
          return jsonResponse({ error: `forecast fetch failed (${forecastRes.status})` }, 502);
        }
        const forecast = await forecastRes.json();

        // Cache result for 1 hour if redis available
        try {
          if (redis) {
            await redis.set(cacheKey, forecast, { ex: 60 * 60 });
          }
        } catch {
          // ignore cache error
        }

        return jsonResponse({ source: "remote", data: forecast });
      } catch {
        // give more context for unexpected failures
        return jsonResponse({ error: "unexpected error fetching forecast" }, 500);
      }
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
