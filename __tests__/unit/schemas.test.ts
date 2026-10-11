import { describe, expect, it } from "vitest";
import {
  historyArraySchema,
  historyEntrySchema,
  ipQuerySchema,
} from "@/lib/schemas";

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
  const valid = {
    id: "a",
    ip: "203.0.113.42",
    ipVersion: "IPv4",
    timestamp: "2026-03-07T00:00:00.000Z",
  };

  it("accepts a valid entry", () => {
    expect(historyEntrySchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a nullable or missing location", () => {
    expect(
      historyEntrySchema.safeParse({ ...valid, location: null }).success,
    ).toBe(true);
    expect(
      historyEntrySchema.safeParse({ ...valid, location: "Paris, FR" }).success,
    ).toBe(true);
  });

  it("rejects an entry missing id, ip or timestamp", () => {
    for (const key of ["id", "ip", "timestamp"] as const) {
      const { [key]: _omitted, ...rest } = valid;
      void _omitted;
      expect(historyEntrySchema.safeParse(rest).success).toBe(false);
    }
  });

  it("rejects a non-string ip", () => {
    expect(historyEntrySchema.safeParse({ ...valid, ip: 12345 }).success).toBe(
      false,
    );
  });

  it("validates arrays and rejects any invalid member", () => {
    expect(historyArraySchema.safeParse([valid, valid]).success).toBe(true);
    expect(historyArraySchema.safeParse([valid, { ip: "x" }]).success).toBe(
      false,
    );
  });
});
