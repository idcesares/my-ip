import { describe, expect, it } from "vitest";
import {
  buildHistoryEntry,
  detectAddressChange,
  formatHistoryLocation,
  shouldRecord,
} from "@/lib/history";
import type { IPInfo } from "@/types";

function ipInfo(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "203.0.113.1",
    ipVersion: "IPv4",
    ipv4: "203.0.113.1",
    ipv6: null,
    isPublic: true,
    source: "x-real-ip",
    confidence: "high",
    provenance: {
      provider: "vercel",
      header: "x-real-ip",
      trusted: true,
      forwarded: true,
    },
    category: "Public",
    timestamp: "2026-07-11T00:00:00.000Z",
    warnings: [],
    request: { userAgent: "test", language: "en", protocol: "https" },
    location: null,
    isp: null,
    ...overrides,
  };
}

describe("formatHistoryLocation", () => {
  it("returns null when there is no location", () => {
    expect(formatHistoryLocation(null)).toBeNull();
  });

  it("joins only the parts that are present", () => {
    expect(
      formatHistoryLocation({
        city: "São Paulo",
        region: null,
        country: "BR",
        timezone: null,
        coordinates: { latitude: null, longitude: null },
      }),
    ).toBe("São Paulo, BR");
  });

  it("returns null when every part is missing", () => {
    expect(
      formatHistoryLocation({
        city: null,
        region: null,
        country: null,
        timezone: null,
        coordinates: { latitude: null, longitude: null },
      }),
    ).toBeNull();
  });
});

describe("buildHistoryEntry", () => {
  it("carries the address, version, timestamp, and formatted location", () => {
    const entry = buildHistoryEntry(
      ipInfo({
        location: {
          city: "Berlin",
          region: "Berlin",
          country: "DE",
          timezone: null,
          coordinates: { latitude: null, longitude: null },
        },
      }),
    );
    expect(entry).toEqual({
      ip: "203.0.113.1",
      ipVersion: "IPv4",
      timestamp: "2026-07-11T00:00:00.000Z",
      location: "Berlin, Berlin, DE",
    });
  });
});

describe("shouldRecord", () => {
  it("records the first observation", () => {
    expect(shouldRecord(null, ipInfo())).toBe(true);
  });

  it("does not record a repeat of the last address", () => {
    expect(shouldRecord("203.0.113.1", ipInfo())).toBe(false);
  });

  it("records a genuinely different address", () => {
    expect(shouldRecord("198.51.100.1", ipInfo())).toBe(true);
  });
});

describe("detectAddressChange", () => {
  it("reports no change for the first observation in a session", () => {
    expect(detectAddressChange(null, ipInfo())).toBeNull();
  });

  it("reports no change when the address repeats", () => {
    expect(detectAddressChange("203.0.113.1", ipInfo())).toBeNull();
  });

  it("reports from/to when the address changes", () => {
    expect(detectAddressChange("198.51.100.1", ipInfo())).toEqual({
      from: "198.51.100.1",
      to: "203.0.113.1",
    });
  });
});
