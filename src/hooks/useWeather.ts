import { useMutation } from "@tanstack/react-query";
import type { FormInput } from "../lib/schema";
import type { WeatherResponse } from "../lib/api";
import { fetchWeather } from "../lib/api";

export function useWeather() {
  return useMutation<WeatherResponse, Error, FormInput>({
    mutationFn: (data) => fetchWeather(data),
  });
}
