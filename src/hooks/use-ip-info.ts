"use client";

import { useCallback } from "react";
import useSWR from "swr";
import type { IPInfo } from "@/types";

const fetcher = async (url: string): Promise<IPInfo> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch IP: ${res.status}`);
  return res.json();
};

export function useIPInfo() {
  const swr = useSWR<IPInfo>("/api/ip?format=json", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  const fetchGeo = useCallback(async () => {
    const data = await fetcher("/api/ip?format=json&include=geo");
    swr.mutate(data, false);
    return data;
  }, [swr]);

  return { ...swr, fetchGeo };
}
