/**
 * ForecastRaw - renders a raw forecast payload for debugging or inspection.
 *
 * @param source - source label (e.g. "cache" or "remote").
 * @param data - raw forecast payload from the API.
 */
export function ForecastRaw({
  source,
  data,
}: {
  source: string;
  data: unknown;
}) {
  return (
    <div className="mt-6">
      <h2 className="font-semibold">Forecast (raw)</h2>
      <pre className="mt-2 p-2 bg-gray-100 rounded max-h-80 overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
      <div className="text-sm text-green-700 mt-2">Fetched: {source}</div>
    </div>
  );
}
