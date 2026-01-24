import type { FormInput } from "./schema";

/**
 * WeatherResponse - envelope returned by the worker API.
 */
export type WeatherResponse = { source: string; data: unknown };

/**
 * fetchWeather - POSTs `payload` to the worker API and returns the parsed response.
 * Throws an Error on network failure or non-2xx responses.
 */
export async function fetchWeather(
  payload: FormInput,
): Promise<WeatherResponse> {
  let res: Response;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const email =
      (import.meta.env.VITE_EMAIL as string | undefined) || undefined;
    if (email) {
      headers["X-User-Email"] = email;
    }

    res = await fetch("/api/weather", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error: ${msg}`);
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}) as unknown)) as {
      error?: string;
    };
    throw new Error(
      err.error ?? `Request failed (${res.status} ${res.statusText})`,
    );
  }

  const json = await res.json();
  return json as WeatherResponse;
}
