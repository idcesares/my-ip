import { describe, expect, it } from "vitest";
import {
  describeMissingFamily,
  IPV6_NOT_SERVED,
  NOT_OBSERVED,
} from "@/lib/address-family";
import type { IPInfo } from "@/types";

const on = (provider: IPInfo["provenance"]["provider"]) => ({
  provenance: { provider, header: null, trusted: false, forwarded: false },
});

describe("describeMissingFamily", () => {
  it("reports IPv6 as not observable on the IPv4-only Vercel host", () => {
    expect(describeMissingFamily(on("vercel"), "IPv6")).toBe(IPV6_NOT_SERVED);
  });

  it("keeps the generic wording for IPv4 on Vercel", () => {
    expect(describeMissingFamily(on("vercel"), "IPv4")).toBe(NOT_OBSERVED);
  });

  it("keeps the generic wording on hosts that may serve IPv6", () => {
    for (const provider of [
      "cloudflare",
      "standard-forwarded",
      "none",
    ] as const) {
      expect(describeMissingFamily(on(provider), "IPv6")).toBe(NOT_OBSERVED);
    }
  });
});
