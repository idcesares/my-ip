import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectIP, isValidDetection } from "@/lib/ip-detection";
import { rateLimit } from "@/lib/rate-limit";
import { DELETE, GET, POST, PUT } from "@/app/api/ip/route";
import type { IPInfo } from "@/types";

vi.mock("@/lib/ip-detection", () => ({
  detectIP: vi.fn(),
  isValidDetection: vi.fn(() => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true, retryAfter: 0 })),
}));

function buildPayload(overrides: Partial<IPInfo> = {}): IPInfo {
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
    timestamp: "2026-02-08T00:00:00.000Z",
    warnings: [],
    request: {
      userAgent: "Test UA",
      language: "en-US",
      protocol: "https",
    },
    location: null,
    isp: null,
    ...overrides,
  };
}

describe("/api/ip route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockReturnValue({ allowed: true, retryAfter: 0 });
    vi.mocked(detectIP).mockResolvedValue(buildPayload());
  });

  it("returns JSON payload by default", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip", {
      headers: { "x-real-ip": "203.0.113.42" },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ip).toBe("203.0.113.42");
    expect(vi.mocked(detectIP)).toHaveBeenCalledWith({ includeGeo: false });
  });

  it("returns plain text when format=text", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?format=text");
    const response = await GET(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(body).toContain("Your IP Address: 203.0.113.42 (IPv4)");
  });

  it("passes includeGeo=true when include=geo", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?include=geo");
    await GET(request);
    expect(vi.mocked(detectIP)).toHaveBeenCalledWith({ includeGeo: true });
  });

  it("returns 400 for invalid query params", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?format=xml");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("INVALID_QUERY");
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfter: 12 });
    const request = new NextRequest("http://localhost:3000/api/ip");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
    expect(body.error).toBe("RATE_LIMITED");
    expect(vi.mocked(detectIP)).not.toHaveBeenCalled();
  });

  it("returns 405 for unsupported methods", async () => {
    const [post, put, del] = await Promise.all([POST(), PUT(), DELETE()]);
    const postBody = await post.json();

    expect(post.status).toBe(405);
    expect(put.status).toBe(405);
    expect(del.status).toBe(405);
    expect(postBody.error).toBe("METHOD_NOT_ALLOWED");
  });

  it("sets Cache-Control header on JSON response", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip");
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
  });

  it("sets Cache-Control header on text response", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?format=text");
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
  });

  it("returns text with location and ISP when present", async () => {
    vi.mocked(detectIP).mockResolvedValue(
      buildPayload({
        location: {
          city: "São Paulo",
          region: "SP",
          country: "BR",
          timezone: "America/Sao_Paulo",
          coordinates: { latitude: -23.5505, longitude: -46.6333 },
        },
        isp: {
          name: "TestISP",
          asn: "AS12345",
          organization: "Test Org",
        },
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/ip?format=text");
    const response = await GET(request);
    const body = await response.text();

    expect(body).toContain("Location: São Paulo, SP, BR");
    expect(body).toContain("ISP: TestISP (AS12345)");
  });

  it("formats text timestamp without stray milliseconds", async () => {
    vi.mocked(detectIP).mockResolvedValue(
      buildPayload({
        timestamp: "2026-03-02T15:30:45.123Z",
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/ip?format=text");
    const response = await GET(request);
    const body = await response.text();

    expect(body).toContain("Timestamp: 2026-03-02 15:30:45 UTC");
    expect(body).not.toContain(".123");
  });

  it("returns 500 when IP detection fails", async () => {
    vi.mocked(isValidDetection).mockReturnValue(false);

    const request = new NextRequest("http://localhost:3000/api/ip");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("IP_DETECTION_FAILED");
  });

  it("returns 400 for unknown include parameter values", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?include=dns");
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("INVALID_QUERY");
  });
});
