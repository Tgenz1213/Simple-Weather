/**
 * Renders a raw forecast payload for debugging or inspection.
 * * @param props - The component properties.
 * @param props.source - Source label (e.g. "cache" or "remote").
 * @param props.data - Raw forecast payload from the API.
 * @returns A formatted pre-tag containing the JSON data.
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
