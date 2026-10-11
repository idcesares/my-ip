import { describe, expect, it } from "vitest";
import {
  disabledPermissionFeatures,
  summarizeCsp,
  summarizeHsts,
  summarizePermissionsPolicy,
  summarizeVerbatim,
} from "@/lib/security-headers";

describe("summarizeCsp", () => {
  it("flags inline scripts allowed without a nonce or hash", () => {
    const summary = summarizeCsp(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'",
    );
    expect(summary.weak).toBe(true);
    expect(summary.text).toBe("Present · allows inline scripts");
  });

  it("does not flag unsafe-inline when a nonce or strict-dynamic neutralizes it", () => {
    expect(summarizeCsp("script-src 'unsafe-inline' 'nonce-abc123'").weak).toBe(
      false,
    );
    expect(
      summarizeCsp("script-src 'unsafe-inline' 'strict-dynamic' https:").text,
    ).not.toMatch(/inline/);
  });

  it("flags eval and any-origin script sources", () => {
    const summary = summarizeCsp("script-src 'self' 'unsafe-eval' https:");
    expect(summary.text).toBe(
      "Present · allows eval, allows scripts from any origin",
    );
  });

  it("falls back to default-src for scripts", () => {
    expect(summarizeCsp("default-src 'self' 'unsafe-inline'").weak).toBe(true);
    expect(summarizeCsp("default-src 'self'")).toEqual({
      text: "Present · restricts script sources",
      weak: false,
    });
  });

  it("flags a policy that does not restrict scripts at all", () => {
    expect(summarizeCsp("img-src 'self'")).toEqual({
      text: "Present · does not restrict scripts",
      weak: true,
    });
  });
});

describe("permissions policy", () => {
  const header =
    'geolocation=(), microphone=(), camera=(), fullscreen=(self "https://a.example")';

  it("finds features disabled entirely, ignoring allowlists with origins", () => {
    expect([...disabledPermissionFeatures(header)].sort()).toEqual([
      "camera",
      "geolocation",
      "microphone",
    ]);
    expect(disabledPermissionFeatures(null).size).toBe(0);
  });

  it("summarizes disabled features", () => {
    expect(summarizePermissionsPolicy(header).text).toBe(
      "Present · disables camera, geolocation, microphone",
    );
    expect(summarizePermissionsPolicy("fullscreen=(self)").text).toBe(
      "Present · 1 feature configured",
    );
  });
});

describe("summarizeHsts", () => {
  it("describes max-age and flags", () => {
    expect(summarizeHsts("max-age=31536000; includeSubDomains").text).toBe(
      "Present · max-age 1 year, includeSubDomains",
    );
    expect(summarizeHsts("max-age=86400; preload").text).toBe(
      "Present · max-age 1 day, preload",
    );
    expect(summarizeHsts("max-age=63072000").text).toBe(
      "Present · max-age 2 years",
    );
    expect(summarizeHsts("max-age=300").text).toBe(
      "Present · max-age 300 seconds",
    );
  });

  it("flags a missing or zero max-age", () => {
    expect(summarizeHsts("includeSubDomains").weak).toBe(true);
    expect(summarizeHsts("max-age=0").weak).toBe(true);
    expect(summarizeHsts("max-age=300").weak).toBe(false);
  });
});

it("shows short headers verbatim", () => {
  expect(summarizeVerbatim(" DENY ").text).toBe("Present · DENY");
});
