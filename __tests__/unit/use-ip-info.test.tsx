import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIPInfo } from "@/hooks/use-ip-info";
import type { IPInfo } from "@/types";

function payload(withGeo: boolean): IPInfo {
  return {
    ip: "203.0.113.9",
    ipVersion: "IPv4",
    ipv4: "203.0.113.9",
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
    location: withGeo
      ? {
          city: "Lisbon",
          region: "Lisboa",
          country: "PT",
          timezone: "Europe/Lisbon",
          coordinates: { latitude: null, longitude: null },
        }
      : null,
    isp: null,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe("useIPInfo", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps requesting location on refresh after it was fetched", async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => payload(url.includes("include=geo")),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIPInfo(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.location).toBeNull();

    await act(async () => {
      await result.current.fetchGeo();
    });
    await waitFor(() =>
      expect(result.current.data?.location?.city).toBe("Lisbon"),
    );

    fetchMock.mockClear();
    await act(async () => {
      await result.current.mutate();
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock.mock.calls.every(([url]) => url.includes("geo"))).toBe(
      true,
    );
    expect(result.current.data?.location?.city).toBe("Lisbon");
  });

  it("does not request location until asked", async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => payload(url.includes("include=geo")),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIPInfo(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(fetchMock.mock.calls.some(([url]) => `${url}`.includes("geo"))).toBe(
      false,
    );
  });
});
