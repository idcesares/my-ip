"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildHistoryEntry,
  detectAddressChange,
  shouldRecord,
  type AddressChange,
} from "@/lib/history";
import { historyArraySchema } from "@/lib/schemas";
import type { HistoryEntry, IPInfo } from "@/types";

const KEY = "ip-history";
const MAX_ITEMS = 10;

/**
 * Storage can be unavailable (blocked site data, private modes) or full, and
 * history is a convenience, so every access degrades to "no history".
 */
function storageGet(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function storageSet(value: string): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Quota or blocked storage: keep the in-memory history only.
  }
}

function storageRemove(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

function readInitialHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = storageGet();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const result = historyArraySchema.safeParse(parsed);
    if (!result.success) {
      storageRemove();
      return [];
    }
    return result.data.map((entry) => ({
      ...entry,
      ipVersion: entry.ipVersion as HistoryEntry["ipVersion"],
      location: entry.location ?? null,
    }));
  } catch {
    storageRemove();
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
      storageSet(JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    storageRemove();
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
