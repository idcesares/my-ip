import type { GeoLocation, HistoryEntry, IPInfo } from "@/types";

export interface AddressChange {
  from: string;
  to: string;
}

export function formatHistoryLocation(
  location: GeoLocation | null,
): string | null {
  if (!location) return null;
  const parts = [location.city, location.region, location.country].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

export function buildHistoryEntry(ip: IPInfo): Omit<HistoryEntry, "id"> {
  return {
    ip: ip.ip,
    ipVersion: ip.ipVersion,
    timestamp: ip.timestamp,
    location: formatHistoryLocation(ip.location),
  };
}

export function shouldRecord(previousIp: string | null, ip: IPInfo): boolean {
  return previousIp !== ip.ip;
}

/**
 * A change is only reportable once a prior address is on record; the first
 * observation in a session has nothing to compare against.
 */
export function detectAddressChange(
  previousIp: string | null,
  ip: IPInfo,
): AddressChange | null {
  if (previousIp === null || previousIp === ip.ip) return null;
  return { from: previousIp, to: ip.ip };
}
