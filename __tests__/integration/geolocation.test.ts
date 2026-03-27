import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectIP } from "@/lib/ip-detection";

// Mock next/headers to return a controlled set of headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-real-ip": "203.0.113.42" })),
}));

function mockIpapiSuccess() {
  return {
    city: "São Paulo",
    region: "SP",
    country_code: "BR",
    timezone: "America/Sao_Paulo",
    latitude: -23.55,
    longitude: -46.63,
    org: "TestISP",
    asn: "AS12345",
  };
}

function mockIpApiSuccess() {
  return {
    status: "success",
    city: "Rio de Janeiro",
    regionName: "RJ",
    countryCode: "BR",
    timezone: "America/Sao_Paulo",
    lat: -22.9,
    lon: -43.17,
    isp: "FallbackISP",
    as: "AS99999",
    org: "Fallback Org",
  };
}

describe("geolocation resolution", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("GEOLOCATION_PROVIDER", "ipapi");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("returns location from primary provider (ipapi.co)", async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.startsWith("https://ipapi.co/")) {
        return new Response(JSON.stringify(mockIpapiSuccess()), { status: 200 });
      }
      return new Response("", { status: 500 });
    }) as typeof fetch;

    const result = await detectIP({ includeGeo: true });

    expect(result.location).not.toBeNull();
    expect(result.location?.city).toBe("São Paulo");
    expect(result.isp?.name).toBe("TestISP");
    expect(result.warnings).not.toEqual(
      expect.arrayContaining([expect.stringContaining("all providers")]),
    );
  });

  it("falls back to ip-api.com when ipapi.co fails", async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.startsWith("https://ipapi.co/")) {
        return new Response("Rate limited", { status: 429 });
      }
      if (urlStr.startsWith("https://ip-api.com/")) {
        return new Response(JSON.stringify(mockIpApiSuccess()), { status: 200 });
      }
      return new Response("", { status: 500 });
    }) as typeof fetch;

    const result = await detectIP({ includeGeo: true });

    expect(result.location).not.toBeNull();
    expect(result.location?.city).toBe("Rio de Janeiro");
    expect(result.isp?.name).toBe("FallbackISP");
    expect(result.warnings).not.toContain(expect.stringContaining("all providers"));
  });

  it("returns null location with warning when both providers fail", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response("Error", { status: 500 });
    }) as typeof fetch;

    const result = await detectIP({ includeGeo: true });

    expect(result.location).toBeNull();
    expect(result.isp).toBeNull();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("all providers were unreachable")]),
    );
  });

  it("falls back when ipapi.co returns invalid JSON", async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.startsWith("https://ipapi.co/")) {
        return new Response("not json", { status: 200, headers: { "Content-Type": "text/plain" } });
      }
      if (urlStr.startsWith("https://ip-api.com/")) {
        return new Response(JSON.stringify(mockIpApiSuccess()), { status: 200 });
      }
      return new Response("", { status: 500 });
    }) as typeof fetch;

    const result = await detectIP({ includeGeo: true });

    expect(result.location).not.toBeNull();
    expect(result.location?.city).toBe("Rio de Janeiro");
  });

  it("falls back when ip-api.com returns status=fail", async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.startsWith("https://ipapi.co/")) {
        return new Response("Error", { status: 500 });
      }
      if (urlStr.startsWith("https://ip-api.com/")) {
        return new Response(JSON.stringify({ status: "fail", message: "invalid query" }), { status: 200 });
      }
      return new Response("", { status: 500 });
    }) as typeof fetch;

    const result = await detectIP({ includeGeo: true });

    expect(result.location).toBeNull();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("all providers were unreachable")]),
    );
  });

  it("skips geolocation when provider is set to none", async () => {
    vi.stubEnv("GEOLOCATION_PROVIDER", "none");
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;

    const result = await detectIP({ includeGeo: true });

    expect(result.location).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not call geo providers when includeGeo is false", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;

    const result = await detectIP({ includeGeo: false });

    expect(result.location).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
