import { describe, expect, it } from "vitest";
import { isValidDetection } from "@/lib/ip-detection";
import type { IPInfo } from "@/types";

function buildDetection(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "203.0.113.42",
    ipVersion: "IPv4",
    ipv4: "203.0.113.42",
    ipv6: null,
    isPublic: true,
    source: "x-real-ip",
    confidence: "high",
    relayLikely: false,
    category: "Public",
    timestamp: new Date().toISOString(),
    warnings: [],
    request: { userAgent: "x", language: "en", protocol: "http" },
    location: null,
    isp: null,
    ...overrides,
  };
}

describe("ip-detection helpers", () => {
  it("rejects fallback detections", () => {
    expect(
      isValidDetection(
        buildDetection({
          ip: "0.0.0.0",
          ipVersion: "Unknown",
          source: "fallback",
          confidence: "low",
          isPublic: false,
          category: "Private",
        }),
      ),
    ).toBe(false);
  });

  it("accepts valid IPv4 detection", () => {
    expect(isValidDetection(buildDetection())).toBe(true);
  });

  it("accepts valid IPv6 detection", () => {
    expect(
      isValidDetection(
        buildDetection({
          ip: "2001:db8::1",
          ipVersion: "IPv6",
          ipv4: null,
          ipv6: "2001:db8::1",
        }),
      ),
    ).toBe(true);
  });

  it("rejects detection with 0.0.0.0 IP even with valid version", () => {
    expect(
      isValidDetection(
        buildDetection({
          ip: "0.0.0.0",
          ipVersion: "IPv4",
        }),
      ),
    ).toBe(false);
  });

  it("rejects detection with Unknown version even with valid IP", () => {
    expect(
      isValidDetection(
        buildDetection({
          ip: "8.8.8.8",
          ipVersion: "Unknown",
        }),
      ),
    ).toBe(false);
  });
});
