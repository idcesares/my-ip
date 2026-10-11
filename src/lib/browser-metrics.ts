/** A finite, non-negative number, or null. Zero is a real value, not "missing". */
export function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

export function normalizeHardwareConcurrency(
  threads: number | undefined,
): number | null {
  return typeof threads === "number" &&
    Number.isInteger(threads) &&
    threads >= 1
    ? threads
    : null;
}

export function normalizeDeviceMemory(
  memory: number | undefined,
): number | null {
  return Number.isFinite(memory) && memory && memory > 0 ? memory : null;
}

export function countScriptVisibleCookies(cookieHeader: string): number {
  const value = cookieHeader.trim();
  return value
    ? value.split(";").filter((cookie) => cookie.trim().length > 0).length
    : 0;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}
