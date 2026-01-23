/**
 * ForecastPeriod - forecast item returned by weather API.
 */
interface ForecastPeriod {
  name: string;
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed?: string;
  windDirection?: string;
  icon?: string;
  isDaytime?: boolean;
}

/**
 * ThreeDayForecast - displays up to three forecast periods.
 * Accepts raw API response in `data` and prefers daytime periods when available.
 *
 * @param data - raw forecast response from weather API
 */
export function ThreeDayForecast({ data }: { data: unknown }) {
  const periods =
    (data as unknown as { properties?: { periods?: ForecastPeriod[] } })
      ?.properties?.periods ?? [];

  const daytime = periods
    .filter((p: ForecastPeriod) => p.isDaytime)
    .slice(0, 3);
  const items = (
    daytime.length >= 3 ? daytime : periods.slice(0, 3)
  ) as ForecastPeriod[];

  if (!items || items.length === 0) {
    return null;
  }

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <section aria-label="3-day-forecast" className="mt-6">
      <h2 className="text-lg font-semibold mb-3">3-Day Forecast</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((p) => (
          <article
            key={p.name}
            className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-4 flex flex-col items-center text-center"
          >
            <div className="text-sm text-slate-500 mb-1">
              {formatDate(p.startTime)}
            </div>
            <div className="text-base font-medium mb-1">{p.name}</div>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-2xl font-bold">{p.temperature}°</div>
              <div className="text-sm text-slate-500">{p.temperatureUnit}</div>
            </div>
            <div className="text-sm mb-2">{p.shortForecast}</div>
            <div className="text-xs text-slate-500">
              {p.windSpeed} {p.windDirection}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
