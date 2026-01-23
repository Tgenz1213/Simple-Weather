import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WeatherForm } from "../components/WeatherForm";

describe("WeatherForm", () => {
  it("shows validation errors for invalid zip and does not call onSearch", async () => {
    const onSearch = vi.fn();
    render(<WeatherForm onSearch={onSearch} loading={false} />);

    const input = screen.getByPlaceholderText("e.g. 90210") as HTMLInputElement;
    const btn = screen.getByRole("button", { name: /get weather/i });

    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.click(btn);

    const err = await screen.findByText(/must be at least/i);
    expect(err).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("calls onSearch with parsed payload when valid input", async () => {
    const onSearch = vi.fn().mockResolvedValue(undefined);
    render(<WeatherForm onSearch={onSearch} loading={false} />);

    const input = screen.getByPlaceholderText("e.g. 90210") as HTMLInputElement;
    const btn = screen.getByRole("button", { name: /get weather/i });

    fireEvent.change(input, { target: { value: "90210" } });
    fireEvent.click(btn);

    // onSearch is async; wait for it to be called
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith({ zip: "90210" });
  });

  it("disables submit when loading prop is true", () => {
    const onSearch = vi.fn();
    render(<WeatherForm onSearch={onSearch} loading={true} />);

    const btn = screen.getByRole("button", { name: /loading…|loading/i });
    expect((btn as HTMLButtonElement).disabled).toBeTruthy();
  });
});
