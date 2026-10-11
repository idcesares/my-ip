"use client";

import { useCallback, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import type { IPInfo } from "@/types";

const BASE_URL = "/api/ip?format=json";
const GEO_URL = "/api/ip?format=json&include=geo";

const fetcher = async (url: string): Promise<IPInfo> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch IP: ${res.status}`);
  return res.json();
};

/**
 * Location is opt-in. Once requested, the geo URL becomes the SWR key so the
 * periodic and manual refreshes keep asking for it instead of silently
 * replacing the result with a location-less response.
 */
export function useIPInfo() {
  const [geoRequested, setGeoRequested] = useState(false);
  const { mutate: setCache } = useSWRConfig();
  const swr = useSWR<IPInfo>(geoRequested ? GEO_URL : BASE_URL, fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  const fetchGeo = useCallback(async () => {
    const data = await fetcher(GEO_URL);
    await setCache(GEO_URL, data, false);
    setGeoRequested(true);
    return data;
  }, [setCache]);

  return { ...swr, fetchGeo };
}
