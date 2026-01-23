import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

describe("App form", () => {
  it("shows validation errors for invalid zip", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("e.g. 90210") as HTMLInputElement;
    const btn = screen.getByRole("button", { name: /get weather/i });

    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.click(btn);

    // validation runs synchronously via zod safeParse in submit
    const err = await screen.findByText(/must be at least/i);
    expect(err).toBeInTheDocument();
  });
});
