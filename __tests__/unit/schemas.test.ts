import { describe, expect, it } from "vitest";
import { historyEntrySchema, ipQuerySchema } from "@/lib/schemas";

describe("ipQuerySchema", () => {
  it("defaults format to json when absent", () => {
    const result = ipQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("json");
    }
  });

  it("accepts format=text", () => {
    const result = ipQuerySchema.safeParse({ format: "text" });
    expect(result.success).toBe(true);
  });

  it("accepts format=plain", () => {
    const result = ipQuerySchema.safeParse({ format: "plain" });
    expect(result.success).toBe(true);
  });

  it("rejects format=xml", () => {
    const result = ipQuerySchema.safeParse({ format: "xml" });
    expect(result.success).toBe(false);
  });

  it("accepts include=geo", () => {
    const result = ipQuerySchema.safeParse({ include: "geo" });
    expect(result.success).toBe(true);
  });

  it("rejects include=dns", () => {
    const result = ipQuerySchema.safeParse({ include: "dns" });
    expect(result.success).toBe(false);
  });

  it("filters empty tokens from include (e.g. ',,,')", () => {
    const result = ipQuerySchema.safeParse({ include: ",,," });
    expect(result.success).toBe(true);
  });

  it("filters empty tokens with valid token mixed in", () => {
    const result = ipQuerySchema.safeParse({ include: ",geo,," });
    expect(result.success).toBe(true);
  });

  it("rejects mixed valid and invalid tokens", () => {
    const result = ipQuerySchema.safeParse({ include: "geo,dns" });
    expect(result.success).toBe(false);
  });

  it("allows undefined include", () => {
    const result = ipQuerySchema.safeParse({ format: "json" });
    expect(result.success).toBe(true);
  });
});

describe("historyEntrySchema", () => {
  it("accepts valid entry", () => {
    const result = historyEntrySchema.safeParse({
      ip: "203.0.113.42",
      ipVersion: "IPv4",
      timestamp: "2026-03-07T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts entry with optional fields", () => {
    const result = historyEntrySchema.safeParse({
      ip: "203.0.113.42",
      ipVersion: "IPv4",
      timestamp: "2026-03-07T00:00:00.000Z",
      source: "x-real-ip",
      confidence: "high",
    });
    expect(result.success).toBe(true);
  });

  it("rejects entry missing ip", () => {
    const result = historyEntrySchema.safeParse({
      ipVersion: "IPv4",
      timestamp: "2026-03-07T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects entry missing timestamp", () => {
    const result = historyEntrySchema.safeParse({
      ip: "203.0.113.42",
      ipVersion: "IPv4",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-string ip", () => {
    const result = historyEntrySchema.safeParse({
      ip: 12345,
      ipVersion: "IPv4",
      timestamp: "2026-03-07T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
