import type { IPInfo } from "@/types";

export type AddressFamily = "IPv4" | "IPv6";

/**
 * Providers whose public hostnames only accept IPv4 connections. Vercel does
 * not serve IPv6 for custom domains (no AAAA records), so a dual-stack visitor
 * always arrives over IPv4 and an IPv6 address can never be observed there.
 * Remove a provider here if it gains IPv6 support.
 */
const IPV4_ONLY_PROVIDERS: ReadonlySet<IPInfo["provenance"]["provider"]> =
  new Set(["vercel"]);

export const NOT_OBSERVED = "Not observed on this request";
export const IPV6_NOT_SERVED =
  "Not observable: this site is served over IPv4 only";

/**
 * One HTTP request only reveals the family it used, so a missing family is
 * normally "not seen on this request". On an IPv4-only host the IPv6 side is
 * not merely unseen but impossible to observe, and the text says so.
 */
export function describeMissingFamily(
  data: Pick<IPInfo, "provenance">,
  family: AddressFamily,
): string {
  if (family === "IPv6" && IPV4_ONLY_PROVIDERS.has(data.provenance.provider)) {
    return IPV6_NOT_SERVED;
  }
  return NOT_OBSERVED;
}
