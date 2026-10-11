import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useHistory, useHistoryRecorder } from "@/hooks/use-history";
import type { IPInfo } from "@/types";

function ipInfo(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "203.0.113.1",
    ipVersion: "IPv4",
    ipv4: "203.0.113.1",
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
    timestamp: "2026-07-11T00:00:00.000Z",
    warnings: [],
    request: { userAgent: "test", language: "en", protocol: "https" },
    location: null,
    isp: null,
    ...overrides,
  };
}

describe("useHistoryRecorder", () => {
  it("records the first observation without reporting a change", () => {
    const add = vi.fn();
    const onAddressChanged = vi.fn();
    renderHook(() => useHistoryRecorder(ipInfo(), add, onAddressChanged));

    expect(add).toHaveBeenCalledOnce();
    expect(onAddressChanged).not.toHaveBeenCalled();
  });

  it("does not re-record when the same address is observed again", () => {
    const add = vi.fn();
    const { rerender } = renderHook(
      ({ ip }: { ip: IPInfo | null }) => useHistoryRecorder(ip, add),
      { initialProps: { ip: ipInfo() } },
    );

    rerender({ ip: ipInfo() });
    expect(add).toHaveBeenCalledOnce();
  });

  it("records and reports a change when the address is different", () => {
    const add = vi.fn();
    const onAddressChanged = vi.fn();
    const { rerender } = renderHook(
      ({ ip }: { ip: IPInfo | null }) =>
        useHistoryRecorder(ip, add, onAddressChanged),
      { initialProps: { ip: ipInfo({ ip: "198.51.100.1" }) } },
    );

    rerender({ ip: ipInfo({ ip: "203.0.113.1" }) });

    expect(add).toHaveBeenCalledTimes(2);
    expect(onAddressChanged).toHaveBeenCalledTimes(1);
    expect(onAddressChanged).toHaveBeenCalledWith({
      from: "198.51.100.1",
      to: "203.0.113.1",
    });
  });

  it("does nothing while there is no Request observation yet", () => {
    const add = vi.fn();
    renderHook(() => useHistoryRecorder(null, add));
    expect(add).not.toHaveBeenCalled();
  });
});

describe("useHistory storage resilience", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const entry = (ip: string) => ({
    ip,
    ipVersion: "IPv4" as const,
    timestamp: "2026-07-11T00:00:00.000Z",
    location: null,
  });

  it("starts empty when reading storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { result } = renderHook(() => useHistory());
    expect(result.current.history).toEqual([]);
  });

  it("keeps in-memory history when writing storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const { result } = renderHook(() => useHistory());
    act(() => result.current.add(entry("203.0.113.1")));
    expect(result.current.history.map((item) => item.ip)).toEqual([
      "203.0.113.1",
    ]);
  });

  it("clears without throwing when removing from storage fails", () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.add(entry("203.0.113.1")));
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    act(() => result.current.clear());
    expect(result.current.history).toEqual([]);
  });

  it("discards corrupt stored data", () => {
    localStorage.setItem("ip-history", "{not json");
    const { result } = renderHook(() => useHistory());
    expect(result.current.history).toEqual([]);
    expect(localStorage.getItem("ip-history")).toBeNull();
  });

  it("caps history at 10 entries, newest first", () => {
    const { result } = renderHook(() => useHistory());
    for (let i = 0; i < 12; i++) {
      act(() => result.current.add(entry(`203.0.113.${i}`)));
    }
    expect(result.current.history).toHaveLength(10);
    expect(result.current.history[0].ip).toBe("203.0.113.11");
  });
});
