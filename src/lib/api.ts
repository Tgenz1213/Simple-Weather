import type { FormInput } from "./schema";

export type WeatherResponse = { source: string; data: unknown };

export async function fetchWeather(payload: FormInput): Promise<WeatherResponse> {
  let res: Response;
  try {
    res = await fetch("/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error: ${msg}`);
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({} as unknown))) as { error?: string };
    throw new Error(err.error ?? `Request failed (${res.status} ${res.statusText})`);
  }

  const json = await res.json();
  return json as WeatherResponse;
}
