import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectIP, isValidDetection } from "@/lib/ip-detection";
import { DELETE, GET, POST, PUT } from "@/app/api/ip/route";
import type { IPInfo } from "@/types";

vi.mock("@/lib/ip-detection", () => ({
  detectIP: vi.fn(),
  isValidDetection: vi.fn(() => true),
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
    provenance: {
      provider: "vercel",
      header: "x-real-ip",
      trusted: true,
      forwarded: true,
    },
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
    vi.mocked(isValidDetection).mockReturnValue(true);
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
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(vi.mocked(detectIP)).toHaveBeenCalledWith(request, {
      includeGeo: false,
    });
  });

  it("returns plain text when format=text", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?format=text");
    const response = await GET(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(body).toContain("Your IP Address: 203.0.113.42 (IPv4)");
  });

  it("passes includeGeo=true when include=geo", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?include=geo");
    await GET(request);
    expect(vi.mocked(detectIP)).toHaveBeenCalledWith(request, {
      includeGeo: true,
    });
  });

  it("returns 400 for invalid query params", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?format=xml");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("INVALID_QUERY");
  });

  it("returns 405 for unsupported methods", async () => {
    const [post, put, del] = await Promise.all([POST(), PUT(), DELETE()]);
    const postBody = await post.json();

    expect(post.status).toBe(405);
    expect(put.status).toBe(405);
    expect(del.status).toBe(405);
    expect(postBody.error).toBe("METHOD_NOT_ALLOWED");
    expect(post.headers.get("Cache-Control")).toBe(
      "no-store, no-cache, must-revalidate",
    );
    expect(post.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(post.headers.get("Allow")).toBe("GET");
  });

  it("sets Cache-Control header on JSON response", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip");
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe(
      "no-store, no-cache, must-revalidate",
    );
  });

  it("sets Cache-Control header on text response", async () => {
    const request = new NextRequest("http://localhost:3000/api/ip?format=text");
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe(
      "no-store, no-cache, must-revalidate",
    );
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

  it("returns raw IP string when format=plain", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/ip?format=plain",
    );
    const response = await GET(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(body).toBe("203.0.113.42");
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store, no-cache, must-revalidate",
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it.each([
    [
      "invalid query",
      new NextRequest("http://localhost:3000/api/ip?format=xml"),
      400,
    ],
    ["detection failure", new NextRequest("http://localhost:3000/api/ip"), 500],
  ])(
    "sets private response headers for %s",
    async (_label, request, expectedStatus) => {
      if (expectedStatus === 500)
        vi.mocked(isValidDetection).mockReturnValue(false);
      const response = await GET(request);

      expect(response.status).toBe(expectedStatus);
      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, must-revalidate",
      );
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    },
  );
});
