import "./App.css";
import { WeatherForm } from "./components/WeatherForm";
import { ThreeDayForecast } from "./components/ThreeDayForecast";
import { useWeather } from "./hooks/useWeather";
import type { FormInput } from "./lib/schema";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

/**
 * ****************************************************************************
 * APP
 * Minimal top-level component: renders header, form, and forecast display.
 * All logic is moved to smaller components / hooks.
 * ****************************************************************************
 */
function AppContent() {
  const mutation = useWeather();

  const handleSearch = async (payload: FormInput) => {
    await mutation.mutateAsync(payload);
  };

  return (
    <div className="app-root p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Weather</h1>

      <WeatherForm onSearch={handleSearch} loading={mutation.status === "pending"} />

      {mutation.isSuccess && (
        <>
          <ThreeDayForecast data={mutation.data?.data} />
        </>
      )}

      {mutation.status === "success" && !mutation.data && (
        <div className="text-sm text-green-700">Fetched</div>
      )}
      <a href="https://www.flaticon.com/free-icons/sun" title="sun icons">Sun icons created by Freepik - Flaticon</a>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
