import { describe, expect, it } from "vitest";
import {
  bucketLogicalProcessors,
  countScriptVisibleCookies,
  normalizeDeviceMemory,
} from "@/lib/browser-metrics";

describe("browser metric normalization", () => {
  it.each([
    [undefined, null],
    [0, null],
    [1, "1–2"],
    [4, "3–4"],
    [8, "5–8"],
    [32, "9+"],
  ])("buckets logical processor hint %s", (input, expected) => {
    expect(bucketLogicalProcessors(input)).toBe(expected);
  });

  it("keeps the browser's already-coarse device-memory value", () => {
    expect(normalizeDeviceMemory(8)).toBe(8);
    expect(normalizeDeviceMemory(0)).toBeNull();
    expect(normalizeDeviceMemory(Number.NaN)).toBeNull();
  });

  it("counts only cookie pairs visible to document.cookie", () => {
    expect(countScriptVisibleCookies("")).toBe(0);
    expect(countScriptVisibleCookies("theme=dark; locale=en-US")).toBe(2);
    expect(countScriptVisibleCookies(" theme=dark ; ; locale=en-US ")).toBe(2);
  });
});
