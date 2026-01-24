import { InputSchema, type FormInput } from "../src/lib/schema";
import { z } from "zod";

// #region Utilities
/**
 * Get cache key for an input object.
 */
export function getCacheKey(input: FormInput): string {
  return `weather:${input.zip ?? input.address ?? `${input.lat},${input.lon}`}`;
}

/**
 * Validate raw input against `InputSchema`.
 * Returns the parsed data when successful, otherwise `null`.
 */
export function validateInput(raw: unknown): FormInput | null {
  const parsed = InputSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * Build headers for weather.gov requests. Includes `X-User-Email` when a valid
 * email is provided.
 */
export function buildWeatherHeaders(userEmail?: string) {
  const headers: Record<string, string> = {
    "User-Agent":
      "Simple-Weather (https://github.com/tgenz1213/Simple-Weather)",
    Accept: "application/geo+json,application/json",
  };

  if (userEmail) {
    const parsed = z.string().email().safeParse(userEmail);
    if (parsed.success) {
      headers["X-User-Email"] = userEmail;
    }
  }

  return headers;
}

/**
 * Extract `forecast` URL from points response.
 */
export function extractForecastUrl(pointsJson: unknown): string | null {
  const p = pointsJson as { properties?: { forecast?: string } } | null;
  return p && p.properties && typeof p.properties.forecast === "string"
    ? p.properties.forecast
    : null;
}

/**
 * Resolve coordinates for the provided input.
 * Accepts a `fetcher` function (dependency injection) so tests can stub it.
 */
export async function resolveCoords(
  input: FormInput,
  fetcher: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
): Promise<{ lat: number; lon: number } | null> {
  // Direct coordinates take precedence
  if (input.lat != null && input.lon != null) {
    return { lat: input.lat, lon: input.lon };
  }

  // ZIP code via zippopotam.us
  if (input.zip) {
    try {
      const res = await fetcher(
        `https://api.zippopotam.us/us/${encodeURIComponent(input.zip)}`,
      );
      if (res.ok) {
        const j = (await res.json()) as {
          places?: Array<{ latitude?: string; longitude?: string }>;
        };
        const place = j.places && j.places[0];
        if (place?.latitude && place?.longitude) {
          const lat = Number(place.latitude);
          const lon = Number(place.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { lat, lon };
          }
        }
      }
    } catch {
      // ignore and fall through to other methods
    }
  }

  // Address via Census geocoder
  if (input.address) {
    try {
      const q = encodeURIComponent(input.address);
      const res = await fetcher(
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
          return { lat: coords.coordinates.y, lon: coords.coordinates.x };
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}
// #endregion
