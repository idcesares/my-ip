import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Re-import for each test to get a fresh module with reset bucket
let rateLimit: typeof import("@/lib/rate-limit").rateLimit;

async function loadFresh() {
  vi.resetModules();
  const mod = await import("@/lib/rate-limit");
  rateLimit = mod.rateLimit;
}

describe("rate-limit", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await loadFresh();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("allows initial requests", () => {
    const result = rateLimit("test-key");
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it("normalizes keys (trim + lowercase)", () => {
    rateLimit("  Example-Key  ");
    const result = rateLimit("example-key");
    expect(result.allowed).toBe(true);
  });

  it("normalizes empty key to 'unknown'", () => {
    const result = rateLimit("");
    expect(result.allowed).toBe(true);

    const result2 = rateLimit("   ");
    expect(result2.allowed).toBe(true);
  });

  it("allows exactly 60 requests then blocks the 61st", () => {
    for (let i = 0; i < 60; i++) {
      const result = rateLimit("boundary-test");
      expect(result.allowed).toBe(true);
    }

    const blocked = rateLimit("boundary-test");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("calculates retryAfter as seconds remaining in window", () => {
    for (let i = 0; i < 60; i++) {
      rateLimit("retry-test");
    }

    vi.advanceTimersByTime(30_000);

    const blocked = rateLimit("retry-test");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBe(30);
  });

  it("resets counter after 60s window expires", () => {
    for (let i = 0; i < 60; i++) {
      rateLimit("window-test");
    }

    expect(rateLimit("window-test").allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    const afterWindow = rateLimit("window-test");
    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.retryAfter).toBe(0);
  });

  it("always allows when RATE_LIMIT_ENABLED=false", () => {
    vi.stubEnv("RATE_LIMIT_ENABLED", "false");

    for (let i = 0; i < 100; i++) {
      const result = rateLimit("disabled-test");
      expect(result.allowed).toBe(true);
    }
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 60; i++) {
      rateLimit("key-a");
    }

    expect(rateLimit("key-a").allowed).toBe(false);
    expect(rateLimit("key-b").allowed).toBe(true);
  });
});
