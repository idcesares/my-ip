import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("allows initial requests", () => {
    const result = rateLimit("test-key");
    expect(result.allowed).toBe(true);
  });

  it("normalizes keys", () => {
    const first = rateLimit("  Example-Key  ");
    const second = rateLimit("example-key");

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });
});
