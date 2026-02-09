"use client";

import { useCallback, useState } from "react";
import type { HistoryEntry } from "@/types";

const KEY = "ip-history";
const MAX_ITEMS = 10;

function readInitialHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    localStorage.removeItem(KEY);
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(readInitialHistory);

  const add = useCallback((item: Omit<HistoryEntry, "id">) => {
    setHistory((prev) => {
      const next = [{ ...item, id: crypto.randomUUID() }, ...prev].slice(0, MAX_ITEMS);
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
