import { useMutation } from "@tanstack/react-query";
import type { FormInput } from "../lib/schema";
import type { WeatherResponse } from "../lib/api";
import { fetchWeather } from "../lib/api";

/**
 * useWeather - React Query mutation hook for fetching weather.
 * Returns the mutation object from `useMutation`.
 */
export function useWeather() {
  return useMutation<WeatherResponse, Error, FormInput>({
    mutationFn: (data) => fetchWeather(data),
  });
}
