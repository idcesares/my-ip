import { describe, expect, it } from "vitest";
import { extractClientIP } from "@/lib/ip-detection";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("extractClientIP", () => {
  // --- Header precedence ---

  it("prefers cf-connecting-ip over all other headers", () => {
    expect(
      extractClientIP(
        headers({
          "cf-connecting-ip": "1.2.3.4",
          "x-real-ip": "5.6.7.8",
          "x-forwarded-for": "9.10.11.12",
        }),
      ),
    ).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when cf-connecting-ip is absent", () => {
    expect(
      extractClientIP(
        headers({
          "x-real-ip": "5.6.7.8",
          "x-forwarded-for": "9.10.11.12",
        }),
      ),
    ).toBe("5.6.7.8");
  });

  it("falls back to x-forwarded-for when higher-priority headers are absent", () => {
    expect(extractClientIP(headers({ "x-forwarded-for": "203.0.113.1" }))).toBe("203.0.113.1");
  });

  it("falls back to forwarded header (RFC 7239)", () => {
    expect(extractClientIP(headers({ forwarded: 'for=198.51.100.10;proto=https' }))).toBe("198.51.100.10");
  });

  it("returns 'unknown' when no headers are present", () => {
    expect(extractClientIP(headers({}))).toBe("unknown");
  });

  // --- x-forwarded-for parsing ---

  it("picks the first public IP from x-forwarded-for", () => {
    expect(
      extractClientIP(headers({ "x-forwarded-for": "10.0.0.1, 192.168.1.1, 203.0.113.50" })),
    ).toBe("203.0.113.50");
  });

  it("falls back to first IP if all x-forwarded-for IPs are private", () => {
    expect(
      extractClientIP(headers({ "x-forwarded-for": "10.0.0.1, 192.168.1.1" })),
    ).toBe("10.0.0.1");
  });

  it("handles single IP in x-forwarded-for", () => {
    expect(extractClientIP(headers({ "x-forwarded-for": "8.8.8.8" }))).toBe("8.8.8.8");
  });

  it("handles x-forwarded-for with whitespace", () => {
    expect(
      extractClientIP(headers({ "x-forwarded-for": "  203.0.113.1 , 10.0.0.1  " })),
    ).toBe("203.0.113.1");
  });

  // --- Forwarded header parsing ---

  it("parses quoted forwarded header", () => {
    expect(extractClientIP(headers({ forwarded: 'for="198.51.100.20"' }))).toBe("198.51.100.20");
  });

  it("parses bracketed IPv6 in forwarded header", () => {
    expect(extractClientIP(headers({ forwarded: "for=[2001:db8::1]" }))).toBe("2001:db8::1");
  });

  // --- Port stripping ---

  it("strips port from cf-connecting-ip", () => {
    expect(extractClientIP(headers({ "cf-connecting-ip": "1.2.3.4:8080" }))).toBe("1.2.3.4");
  });

  it("strips port from x-forwarded-for entries", () => {
    expect(extractClientIP(headers({ "x-forwarded-for": "203.0.113.1:3000, 10.0.0.1:8080" }))).toBe("203.0.113.1");
  });

  // --- IPv6 ---

  it("handles plain IPv6 in x-real-ip", () => {
    expect(extractClientIP(headers({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("handles bracketed IPv6 with port in x-real-ip", () => {
    expect(extractClientIP(headers({ "x-real-ip": "[2001:db8::1]:443" }))).toBe("2001:db8::1");
  });

  // --- Edge cases ---

  it("returns 'unknown' for empty x-forwarded-for", () => {
    expect(extractClientIP(headers({ "x-forwarded-for": "  ,  , " }))).toBe("unknown");
  });

  it("returns 'unknown' for malformed forwarded header", () => {
    expect(extractClientIP(headers({ forwarded: "by=unknown;host=example.com" }))).toBe("unknown");
  });
});
