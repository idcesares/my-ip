import { afterEach, describe, expect, it, vi } from "vitest";
import { detectIP, observeRequest } from "@/lib/ip-detection";

function request(
  headers: Record<string, string> = {},
  url = "https://example.com/api/ip",
) {
  return new Request(url, { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("request observation", () => {
  it("uses Vercel's trusted IP and ignores an injected Cloudflare header", () => {
    vi.stubEnv("VERCEL", "1");
    const result = observeRequest(
      request({
        "x-real-ip": "203.0.113.7",
        "cf-connecting-ip": "1.1.1.1",
        "x-forwarded-for": "8.8.8.8",
      }),
    );

    expect(result.ip).toBe("203.0.113.7");
    expect(result.provenance).toEqual({
      provider: "vercel",
      header: "x-real-ip",
      trusted: true,
      forwarded: true,
    });
  });

  it("does not fall back to client proxy headers when Vercel's value is invalid", () => {
    vi.stubEnv("VERCEL", "1");
    const result = observeRequest(
      request({
        "x-real-ip": "not-an-ip",
        "cf-connecting-ip": "1.1.1.1",
        "x-forwarded-for": "8.8.8.8",
      }),
    );

    expect(result.source).toBe("fallback");
    expect(result.ip).toBe("0.0.0.0");
  });

  it("trusts Cloudflare only in explicit trusted-proxy mode", () => {
    vi.stubEnv("VERCEL", "");
    const untrusted = observeRequest(
      request({ "cf-connecting-ip": "1.1.1.1" }),
    );
    expect(untrusted.source).toBe("fallback");

    vi.stubEnv("TRUSTED_PROXY_MODE", "cloudflare");
    const trusted = observeRequest(request({ "cf-connecting-ip": "1.1.1.1" }));
    expect(trusted.ip).toBe("1.1.1.1");
    expect(trusted.provenance.trusted).toBe(true);
  });

  it("fails closed when explicit Cloudflare identity is invalid", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("TRUSTED_PROXY_MODE", "cloudflare");
    const result = observeRequest(
      request({
        "cf-connecting-ip": "invalid",
        "x-real-ip": "1.1.1.1",
        "x-forwarded-for": "8.8.8.8",
      }),
    );

    expect(result.source).toBe("fallback");
  });

  it("skips invalid forwarded entries and canonicalizes IPv4-mapped IPv6", () => {
    vi.stubEnv("VERCEL", "");
    const forwarded = observeRequest(
      request({ "x-forwarded-for": "garbage, 10.0.0.1, 8.8.8.8" }),
    );
    expect(forwarded.ip).toBe("8.8.8.8");

    const mapped = observeRequest(request({ "x-real-ip": "::ffff:192.0.2.1" }));
    expect(mapped.ip).toBe("192.0.2.1");
  });

  it("parses quoted RFC Forwarded IPv6 addresses with ports", () => {
    vi.stubEnv("VERCEL", "");
    const result = observeRequest(
      request({ forwarded: 'for="[2001:db8::1]:4711";proto=https' }),
    );
    expect(result.ip).toBe("2001:db8::1");
    expect(result.source).toBe("forwarded");
  });
});

describe("IP detection", () => {
  it("uses Vercel geolocation headers without making a third-party request", async () => {
    vi.stubEnv("VERCEL", "1");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await detectIP(
      request({
        "x-real-ip": "8.8.8.8",
        "x-vercel-ip-city": "S%C3%A3o%20Paulo",
        "x-vercel-ip-country-region": "SP",
        "x-vercel-ip-country": "BR",
        "x-vercel-ip-latitude": "-23.5505",
        "x-vercel-ip-longitude": "-46.6333",
        "x-vercel-ip-timezone": "America/Sao_Paulo",
      }),
      { includeGeo: true },
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.location).toEqual({
      city: "São Paulo",
      region: "SP",
      country: "BR",
      timezone: "America/Sao_Paulo",
      coordinates: { latitude: -23.5505, longitude: -46.6333 },
    });
    expect(result.isp).toBeNull();
  });

  it("does not expose geolocation unless requested", async () => {
    vi.stubEnv("VERCEL", "1");
    const result = await detectIP(
      request({ "x-real-ip": "8.8.8.8", "x-vercel-ip-country": "BR" }),
      { includeGeo: false },
    );

    expect(result.location).toBeNull();
  });
});
