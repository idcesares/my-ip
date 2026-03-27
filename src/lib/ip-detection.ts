import { headers } from "next/headers";
import { detectIPVersion, getIPCategory, isPrivateIP, stripPort } from "@/lib/ip-utils";
import { geoSchema } from "@/lib/schemas";
import type { GeoLocation, IPInfo, ISPInfo } from "@/types";

type IPSource = IPInfo["source"];
type IPConfidence = IPInfo["confidence"];

function parseForwardedFor(forwarded: string): string | null {
  const match = forwarded.match(/for=([^;,\s]+)/i);
  if (!match?.[1]) return null;
  return match[1].replace(/"/g, "").replace(/^\[/, "").replace(/\]$/, "");
}

/**
 * Extract the client IP string from request headers using the standard
 * header precedence chain. Shared by rate limiting and IP detection to
 * ensure both use identical logic.
 */
export function extractClientIP(hdrs: Headers): string {
  const chain = ["cf-connecting-ip", "x-real-ip"] as const;

  for (const key of chain) {
    const value = hdrs.get(key);
    if (value) {
      return stripPort(value) || "unknown";
    }
  }

  const xff = hdrs.get("x-forwarded-for");
  if (xff) {
    const values = xff
      .split(",")
      .map((p) => stripPort(p.trim()))
      .filter(Boolean);
    const publicCandidate = values.find((ip) => !isPrivateIP(ip));
    return publicCandidate ?? values[0] ?? "unknown";
  }

  const forwarded = hdrs.get("forwarded");
  if (forwarded) {
    const forValue = parseForwardedFor(forwarded);
    if (forValue) {
      return stripPort(forValue) || "unknown";
    }
  }

  return "unknown";
}

function pickCandidate(raw: Awaited<ReturnType<typeof headers>>) {
  const chain = [
    { key: "cf-connecting-ip", source: "cloudflare" as const },
    { key: "x-real-ip", source: "x-real-ip" as const },
  ];

  for (const item of chain) {
    const value = raw.get(item.key);
    if (value) {
      return { ip: stripPort(value), source: item.source };
    }
  }

  const xff = raw.get("x-forwarded-for");
  if (xff) {
    const values = xff
      .split(",")
      .map((p) => stripPort(p.trim()))
      .filter(Boolean);

    const publicCandidate = values.find((ip) => !isPrivateIP(ip));
    return { ip: publicCandidate ?? values[0] ?? "", source: "x-forwarded-for" as const };
  }

  const forwarded = raw.get("forwarded");
  if (forwarded) {
    const forValue = parseForwardedFor(forwarded);
    if (forValue) {
      return { ip: stripPort(forValue), source: "forwarded" as const };
    }
  }

  return { ip: "0.0.0.0", source: "fallback" as const };
}

type GeoResult = { location: GeoLocation | null; isp: ISPInfo | null; providerUsed: string | null };

function toGeoResult(
  parsed: { city: string | null; region: string | null; country: string | null; timezone: string | null; latitude: number | null; longitude: number | null; isp: string | null; asn: string | null; org: string | null },
  provider: string,
): GeoResult {
  return {
    location: {
      city: parsed.city,
      region: parsed.region,
      country: parsed.country,
      timezone: parsed.timezone,
      coordinates: { latitude: parsed.latitude, longitude: parsed.longitude },
    },
    isp: { name: parsed.isp, asn: parsed.asn, organization: parsed.org },
    providerUsed: provider,
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number, userAgent: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "User-Agent": userAgent },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromIpapi(ip: string): Promise<GeoResult> {
  const response = await fetchWithTimeout(
    `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
    3_500,
    "whats-my-ip-app/1.0",
  );

  if (!response.ok) {
    throw new Error(`ipapi.co returned ${response.status}`);
  }

  const raw = await response.json();
  const parsed = geoSchema.safeParse({
    city: raw.city ?? null,
    region: raw.region ?? null,
    country: raw.country_code ?? null,
    timezone: raw.timezone ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    isp: raw.org ?? null,
    asn: raw.asn ?? null,
    org: raw.org ?? null,
  });

  if (!parsed.success) {
    throw new Error("ipapi.co returned invalid data");
  }

  return toGeoResult(parsed.data, "ipapi.co");
}

async function fetchFromIpApi(ip: string): Promise<GeoResult> {
  const response = await fetchWithTimeout(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,city,regionName,countryCode,timezone,lat,lon,isp,as,org`,
    3_500,
    "whats-my-ip-app/1.0",
  );

  if (!response.ok) {
    throw new Error(`ip-api.com returned ${response.status}`);
  }

  const raw = await response.json();

  if (raw.status === "fail") {
    throw new Error(`ip-api.com: ${raw.message ?? "lookup failed"}`);
  }

  const parsed = geoSchema.safeParse({
    city: raw.city ?? null,
    region: raw.regionName ?? null,
    country: raw.countryCode ?? null,
    timezone: raw.timezone ?? null,
    latitude: raw.lat ?? null,
    longitude: raw.lon ?? null,
    isp: raw.isp ?? null,
    asn: raw.as ?? null,
    org: raw.org ?? null,
  });

  if (!parsed.success) {
    throw new Error("ip-api.com returned invalid data");
  }

  return toGeoResult(parsed.data, "ip-api.com");
}

const GEO_NULL: GeoResult = { location: null, isp: null, providerUsed: null };

async function resolveGeo(ip: string): Promise<GeoResult> {
  const provider = process.env.GEOLOCATION_PROVIDER ?? "ipapi";

  if (provider === "none") {
    return GEO_NULL;
  }

  // Try primary provider, then fallback
  const providers: Array<{ name: string; fn: (ip: string) => Promise<GeoResult> }> = [
    { name: "ipapi.co", fn: fetchFromIpapi },
    { name: "ip-api.com", fn: fetchFromIpApi },
  ];

  for (const { name, fn } of providers) {
    try {
      return await fn(ip);
    } catch (error) {
      const reason = error instanceof DOMException && error.name === "AbortError"
        ? "timeout"
        : error instanceof Error ? error.message : "unknown error";
      console.warn(`[geo] ${name} failed: ${reason}`);
    }
  }

  return GEO_NULL;
}

export async function detectIP(options?: { includeGeo?: boolean }): Promise<IPInfo> {
  const hdrs = await headers();
  const warnings: string[] = [];
  const candidate = pickCandidate(hdrs);

  const ipVersion = detectIPVersion(candidate.ip);
  const category = getIPCategory(candidate.ip);

  if (category !== "Public") {
    warnings.push(`Address category: ${category}`);
  }

  if (candidate.source === "x-forwarded-for" || candidate.source === "forwarded") {
    warnings.push("IP detected via proxy header; may differ when using VPN, Tor, or relay services.");
  }

  if (candidate.source === "fallback" || ipVersion === "Unknown") {
    warnings.push("Unable to determine a reliable public IP from request headers.");
  }

  let location: GeoLocation | null = null;
  let isp: ISPInfo | null = null;

  if (options?.includeGeo) {
    const geo = await resolveGeo(candidate.ip);
    location = geo.location;
    isp = geo.isp;

    if (!location) {
      warnings.push("Geolocation lookup failed — all providers were unreachable or returned no data.");
    }
  }

  const confidence: IPConfidence =
    candidate.source === "cloudflare" || candidate.source === "x-real-ip"
      ? "high"
      : candidate.source === "x-forwarded-for" || candidate.source === "forwarded"
        ? "medium"
        : "low";
  const relayLikely = candidate.source === "x-forwarded-for" || candidate.source === "forwarded";

  return {
    ip: candidate.ip,
    ipVersion,
    ipv4: ipVersion === "IPv4" ? candidate.ip : null,
    ipv6: ipVersion === "IPv6" ? candidate.ip : null,
    isPublic: category === "Public",
    source: candidate.source as IPSource,
    confidence,
    relayLikely,
    category,
    timestamp: new Date().toISOString(),
    warnings,
    location,
    isp,
    request: {
      userAgent: (hdrs.get("user-agent") ?? "Unknown").slice(0, 512),
      language: (hdrs.get("accept-language")?.split(",")[0] ?? "Unknown").slice(0, 64),
      protocol: hdrs.get("x-forwarded-proto") === "https" ? "https" : "http",
    },
  };
}

export function isValidDetection(result: IPInfo): boolean {
  return result.ip !== "0.0.0.0" && result.ipVersion !== "Unknown";
}
