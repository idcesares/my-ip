export function bucketLogicalProcessors(
  threads: number | undefined,
): string | null {
  if (!Number.isFinite(threads) || !threads || threads < 1) return null;
  if (threads <= 2) return "1–2";
  if (threads <= 4) return "3–4";
  if (threads <= 8) return "5–8";
  return "9+";
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
