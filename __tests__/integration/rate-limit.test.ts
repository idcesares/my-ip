import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("allows initial requests", () => {
    const result = rateLimit("test-key");
    expect(result.allowed).toBe(true);
  });
});