import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThreeDayForecast } from "../components/ThreeDayForecast";

const sample = {
  properties: {
    periods: [
      {
        name: "Today",
        startTime: "2026-01-23T14:00:00-05:00",
        temperature: 55,
        temperatureUnit: "F",
        shortForecast: "Partly Sunny",
        windSpeed: "5 to 10 mph",
        windDirection: "NW",
        isDaytime: true,
      },
      {
        name: "Tonight",
        startTime: "2026-01-23T19:00:00-05:00",
        temperature: 40,
        temperatureUnit: "F",
        shortForecast: "Mostly Clear",
        windSpeed: "5 mph",
        windDirection: "W",
        isDaytime: false,
      },
      {
        name: "Tomorrow",
        startTime: "2026-01-24T14:00:00-05:00",
        temperature: 58,
        temperatureUnit: "F",
        shortForecast: "Mostly Sunny",
        windSpeed: "10 mph",
        windDirection: "NE",
        isDaytime: true,
      },
    ],
  },
};

describe("ThreeDayForecast", () => {
  it("renders three day cards with temps and wind info", () => {
    render(<ThreeDayForecast data={sample} />);
    expect(screen.getByText(/3-day forecast/i)).toBeInTheDocument();
    expect(screen.getByText(/Today/)).toBeInTheDocument();
    expect(screen.getByText(/55°/)).toBeInTheDocument();
    expect(screen.getByText(/Partly Sunny/i)).toBeInTheDocument();
    expect(screen.getByText(/5 to 10 mph/i)).toBeInTheDocument();
  });
});
