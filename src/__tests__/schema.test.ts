import { describe, it, expect } from "vitest";
import { InputSchema } from "../lib/schema";

describe("InputSchema", () => {
  it("accepts valid zip", () => {
    const parsed = InputSchema.safeParse({ zip: "90210" });
    expect(parsed.success).toBe(true);
  });

  it("accepts address", () => {
    const parsed = InputSchema.safeParse({
      address: "1600 Pennsylvania Ave NW, Washington, DC",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects too short zip", () => {
    const parsed = InputSchema.safeParse({ zip: "123" });
    expect(parsed.success).toBe(false);
  });
});
