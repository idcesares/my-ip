import { describe, expect, it } from "vitest";
import {
  countScriptVisibleCookies,
  finiteOrNull,
  median,
  normalizeDeviceMemory,
  normalizeHardwareConcurrency,
} from "@/lib/browser-metrics";

describe("browser metrics", () => {
  it("keeps zero as a real value and rejects non-finite or negative numbers", () => {
    expect(finiteOrNull(0)).toBe(0);
    expect(finiteOrNull(1.4)).toBe(1.4);
    expect(finiteOrNull(Infinity)).toBeNull();
    expect(finiteOrNull(NaN)).toBeNull();
    expect(finiteOrNull(-1)).toBeNull();
    expect(finiteOrNull(undefined)).toBeNull();
    expect(finiteOrNull("10")).toBeNull();
  });

  it("reports the exact logical processor count when valid", () => {
    expect(normalizeHardwareConcurrency(4)).toBe(4);
    expect(normalizeHardwareConcurrency(16)).toBe(16);
    expect(normalizeHardwareConcurrency(0)).toBeNull();
    expect(normalizeHardwareConcurrency(2.5)).toBeNull();
    expect(normalizeHardwareConcurrency(undefined)).toBeNull();
  });

  it("normalizes device memory", () => {
    expect(normalizeDeviceMemory(8)).toBe(8);
    expect(normalizeDeviceMemory(0)).toBeNull();
    expect(normalizeDeviceMemory(undefined)).toBeNull();
  });

  it("counts only script-visible cookies", () => {
    expect(countScriptVisibleCookies("")).toBe(0);
    expect(countScriptVisibleCookies("a=1; b=2;")).toBe(2);
  });

  it("computes the median of odd and even sample counts", () => {
    expect(median([])).toBeNull();
    expect(median([40])).toBe(40);
    expect(median([90, 10, 50])).toBe(50);
    expect(median([10, 20, 30, 41])).toBe(25);
  });
});
