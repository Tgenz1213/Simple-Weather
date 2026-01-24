import { Redis } from "@upstash/redis";
import { InputSchema } from "../src/lib/schema";
import { z } from "zod";

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
      const parse = InputSchema.safeParse(raw);
      if (!parse.success) {
        return jsonResponse({ error: "Invalid input" }, 400);
      }
      const input = parse.data;

      const cacheKey = `weather:${input.zip ?? input.address ?? `${input.lat},${input.lon}`}`;

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

      let lat: number | null = null;
      let lon: number | null = null;

      if (input.lat != null && input.lon != null) {
        lat = input.lat;
        lon = input.lon;
      } else if (input.zip) {
        try {
          const res = await fetch(
            `https://api.zippopotam.us/us/${encodeURIComponent(input.zip)}`,
          );
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
          // ignore geocoding errors
        }
      } else if (input.address) {
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
            const coords =
              j.result && j.result.addressMatches && j.result.addressMatches[0];
            if (
              coords &&
              coords.coordinates &&
              typeof coords.coordinates.x === "number" &&
              typeof coords.coordinates.y === "number"
            ) {
              lat = coords.coordinates.y;
              lon = coords.coordinates.x;
            }
          }
        } catch {
          // ignore geocoding errors
        }
      }

      if (lat == null || lon == null) {
        return jsonResponse({ error: "Unable to resolve location" }, 400);
      }

      try {
        const headers = {
          // Weather.gov requires a User-Agent identifying the client; use repo URL so it's traceable.
          "User-Agent":
            "Simple-Weather (https://github.com/tgenz1213/Simple-Weather)",
          Accept: "application/geo+json,application/json",
        } as Record<string, string>;

        // Validate developer contact email from header (X-User-Email) and propagate when valid
        const userEmailFromHeader = request.headers.get("x-user-email");
        if (userEmailFromHeader) {
          const parsed = z.email().safeParse(userEmailFromHeader);
          if (parsed.success) {
            headers["X-User-Email"] = userEmailFromHeader;
          }
        }

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
        const points = (await pointsRes.json()) as {
          properties?: { forecast?: string };
        };
        const forecastUrl = points.properties?.forecast;
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
