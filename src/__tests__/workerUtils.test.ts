import { describe, it, expect } from "vitest";
import {
  getCacheKey,
  validateInput,
  buildWeatherHeaders,
  extractForecastUrl,
  resolveCoords,
} from "../../worker/lib";

describe("worker lib helpers", () => {
  it("getCacheKey uses zip/address/coords in that order", () => {
    expect(getCacheKey({ zip: "12345" })).toBe("weather:12345");
    expect(getCacheKey({ address: "1 Main St" })).toBe("weather:1 Main St");
    expect(getCacheKey({ lat: 1, lon: 2 })).toBe("weather:1,2");
  });

  it("validateInput returns parsed data or null for invalid input", () => {
    expect(validateInput({ zip: "12345" })).toEqual({ zip: "12345" });
    expect(validateInput({ lat: "not-a-number" } as unknown)).toBeNull();
  });

  it("buildWeatherHeaders returns base headers and includes valid email", () => {
    const h = buildWeatherHeaders("dev@example.com");
    expect(h["User-Agent"]).toContain("Simple-Weather");
    expect(h.Accept).toBe("application/geo+json,application/json");
    expect(h["X-User-Email"]).toBe("dev@example.com");

    const h2 = buildWeatherHeaders("not-an-email");
    expect(h2["X-User-Email"]).toBeUndefined();
  });

  it("extractForecastUrl returns URL when present", () => {
    const obj = { properties: { forecast: "https://example.org" } };
    expect(extractForecastUrl(obj)).toBe("https://example.org");
    expect(extractForecastUrl({})).toBeNull();
  });

  it("resolveCoords returns direct coords when provided", async () => {
    const fetcher = async () => ({ ok: false }) as unknown as Response;
    const coords = await resolveCoords({ lat: 10, lon: 20 }, fetcher);
    expect(coords).toEqual({ lat: 10, lon: 20 });
  });

  it("resolveCoords resolves ZIP via zippopotam.us", async () => {
    const fetcher = async (input: RequestInfo) => {
      const url = String(input);
      expect(url).toContain("api.zippopotam.us");
      return {
        ok: true,
        json: async () => ({
          places: [{ latitude: "10.5", longitude: "20.5" }],
        }),
      } as unknown as Response;
    };
    const coords = await resolveCoords({ zip: "12345" }, fetcher);
    expect(coords).toEqual({ lat: 10.5, lon: 20.5 });
  });

  it("resolveCoords resolves address via census geocoder", async () => {
    const fetcher = async (input: RequestInfo) => {
      const url = String(input);
      expect(url).toContain("geocoding.geo.census.gov");
      return {
        ok: true,
        json: async () => ({
          result: { addressMatches: [{ coordinates: { x: 30, y: 40 } }] },
        }),
      } as unknown as Response;
    };
    const coords = await resolveCoords({ address: "1 Main St" }, fetcher);
    expect(coords).toEqual({ lat: 40, lon: 30 });
  });

  it("resolveCoords returns null when geocoding fails", async () => {
    const fetcher = async () => ({ ok: false }) as unknown as Response;
    const coords = await resolveCoords({ zip: "00000" }, fetcher);
    expect(coords).toBeNull();
  });
});
