import type { FormInput } from "./schema";

/**
 * WeatherResponse - envelope returned by the worker API.
 */
export type WeatherResponse = { source: string; data: unknown };

/**
 * fetchWeather - POSTs `payload` to the worker API and returns the parsed response.
 *
 * When the environment variable VITE_EMAIL is set, its value is added as an
 * X-User-Email request header on the outgoing request.
 *
 * @param payload - Form input sent to the worker API (/api/weather).
 * @returns A promise resolving to the WeatherResponse returned by the worker.
 * @throws Error on network failure or when the worker responds with a non-2xx status.
 */
export async function fetchWeather(
  payload: FormInput,
): Promise<WeatherResponse> {
  let res: Response;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const email = import.meta.env.VITE_EMAIL as string | undefined;
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
