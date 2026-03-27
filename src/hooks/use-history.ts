"use client";

import { useCallback, useState } from "react";
import { z } from "zod";
import type { HistoryEntry } from "@/types";

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for older browsers without crypto.randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

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
      const next = [{ ...item, id: generateId() }, ...prev].slice(0, MAX_ITEMS);
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
