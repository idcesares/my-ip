"use client";

import useSWR from "swr";
import type { IPInfo } from "@/types";

const fetcher = async (url: string): Promise<IPInfo> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch IP: ${res.status}`);
  return res.json();
};

export function useIPInfo() {
  return useSWR<IPInfo>("/api/ip?format=json", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });
}