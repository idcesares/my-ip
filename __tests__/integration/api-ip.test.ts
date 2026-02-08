import { describe, expect, it } from "vitest";
import { isValidDetection } from "@/lib/ip-detection";

describe("ip-detection helpers", () => {
  it("rejects fallback detections", () => {
    expect(
      isValidDetection({
        ip: "0.0.0.0",
        ipVersion: "Unknown",
        ipv4: null,
        ipv6: null,
        isPublic: false,
        source: "fallback",
        category: "Private",
        timestamp: new Date().toISOString(),
        warnings: [],
        request: { userAgent: "x", language: "en", protocol: "http" },
        location: null,
        isp: null,
      }),
    ).toBe(false);
  });
});