"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  buildHistoryEntry,
  detectAddressChange,
  shouldRecord,
  type AddressChange,
} from "@/lib/history";
import type { HistoryEntry, IPInfo } from "@/types";

const KEY = "ip-history";
const MAX_ITEMS = 10;

const historyEntrySchema = z.object({
  id: z.string(),
  ip: z.string(),
  ipVersion: z.string(),
  timestamp: z.string(),
  location: z.string().nullable().optional(),
});

const historyArraySchema = z.array(historyEntrySchema);

function readInitialHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const result = historyArraySchema.safeParse(parsed);
    if (!result.success) {
      localStorage.removeItem(KEY);
      return [];
    }
    return result.data.map((entry) => ({
      ...entry,
      ipVersion: entry.ipVersion as HistoryEntry["ipVersion"],
      location: entry.location ?? null,
    }));
  } catch {
    localStorage.removeItem(KEY);
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(readInitialHistory);

  const add = useCallback((item: Omit<HistoryEntry, "id">) => {
    setHistory((prev) => {
      const next = [{ ...item, id: crypto.randomUUID() }, ...prev].slice(
        0,
        MAX_ITEMS,
      );
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  return { history, add, clear };
}

/**
 * Owns the decision behind recording a Request observation into Local
 * history: whether this address is new since the last one recorded, and
 * whether it counts as a change worth reporting through onAddressChanged.
 */
export function useHistoryRecorder(
  ipInfo: IPInfo | null,
  add: (item: Omit<HistoryEntry, "id">) => void,
  onAddressChanged?: (change: AddressChange) => void,
) {
  const lastRecordedIp = useRef<string | null>(null);
  const onAddressChangedRef = useRef(onAddressChanged);

  useEffect(() => {
    onAddressChangedRef.current = onAddressChanged;
  }, [onAddressChanged]);

  useEffect(() => {
    if (!ipInfo) return;
    if (!shouldRecord(lastRecordedIp.current, ipInfo)) return;

    const change = detectAddressChange(lastRecordedIp.current, ipInfo);
    if (change) onAddressChangedRef.current?.(change);

    add(buildHistoryEntry(ipInfo));
    lastRecordedIp.current = ipInfo.ip;
  }, [add, ipInfo]);
}
