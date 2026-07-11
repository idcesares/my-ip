import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHistoryRecorder } from "@/hooks/use-history";
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
