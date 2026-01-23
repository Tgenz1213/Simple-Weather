import React, { useState } from "react";
import type { ZodIssue } from "zod";
import { InputSchema, type FormInput } from "../lib/schema";

/**
 * WeatherForm - renders a simple search form for ZIP code or address.
 *
 * @param props.onSearch - called with validated FormInput when the form is submitted.
 * @param props.loading - disables submission while true.
 */
export function WeatherForm(props: {
  onSearch: (payload: FormInput) => Promise<void> | void;
  loading?: boolean;
}) {
  const { onSearch, loading } = props;
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = InputSchema.safeParse({
      zip: zip || undefined,
      address: address || undefined,
    });
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((s: ZodIssue) => {
          const m = s.message;
          return m.replace(
            /Too small: expected string to have >=(\d+) characters/i,
            "must be at least $1 characters",
          );
        })
        .join(", ");
      setError(msg);
      return;
    }
    try {
      await onSearch(parsed.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">ZIP code</label>
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="e.g. 90210"
          className="input px-3 py-2 border rounded w-full"
          inputMode="numeric"
          maxLength={10}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Address (optional)
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="1600 Pennsylvania Ave NW, Washington, DC"
          className="input px-3 py-2 border rounded w-full"
          maxLength={200}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="submit"
          className="btn bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Loading…" : "Get Weather"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </form>
  );
}
