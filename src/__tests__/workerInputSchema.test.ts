import { describe, it, expect } from "vitest";
import { InputSchema } from "../lib/schema";

describe("worker InputSchema", () => {
  it("rejects zip shorter than 5 characters", () => {
    const result = InputSchema.safeParse({ zip: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects zip longer than 10 characters", () => {
    const result = InputSchema.safeParse({ zip: "12345678901" });
    expect(result.success).toBe(false);
  });

  it("accepts zip with 5 characters", () => {
    const result = InputSchema.safeParse({ zip: "12345" });
    expect(result.success).toBe(true);
  });

  it("accepts missing zip when address present", () => {
    const result = InputSchema.safeParse({
      address: "1600 Pennsylvania Ave NW",
    });
    expect(result.success).toBe(true);
  });

  it("rejects address longer than 200 characters", () => {
    const longAddress = "A".repeat(201);
    const result = InputSchema.safeParse({ address: longAddress });
    expect(result.success).toBe(false);
  });
});
