import type { HeaderMeasurementStatus } from "@/types";
import type { HeaderSummary } from "@/lib/security-headers";

export function yesNo(value: boolean | null, unsupported = "Unsupported") {
  return value === null ? unsupported : value ? "Yes" : "No";
}

/**
 * Network Information values are `null` both when the API is missing and when
 * a browser reports a non-finite value (for example `downlinkMax: Infinity`),
 * so the label distinguishes the two rather than calling both "Unsupported".
 */
export function estimate(
  value: number | null,
  unit: string,
  apiSupported: boolean,
): string {
  if (value === null) return apiSupported ? "Not reported" : "Unsupported";
  return `${value} ${unit} (estimate)`;
}

export function headerValue(
  status: HeaderMeasurementStatus,
  value: string | null,
  summarize: (value: string) => HeaderSummary,
): string {
  if (status === "checking") return "Checking…";
  if (status === "unavailable") return "Unavailable";
  return value ? summarize(value).text : "Not observed";
}

export function formatMeasuredAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleTimeString();
}
