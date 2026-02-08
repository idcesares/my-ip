import { headers } from "next/headers";
import { detectIPVersion, getIPCategory, isPrivateIP, stripPort } from "@/lib/ip-utils";
import { geoSchema } from "@/lib/schemas";
import type { GeoLocation, IPInfo, ISPInfo } from "@/types";

type IPSource = IPInfo["source"];

function parseForwardedFor(forwarded: string): string | null {
  const match = forwarded.match(/for=([^;,\s]+)/i);
  if (!match?.[1]) return null;
  return match[1].replace(/"/g, "").replace(/^\[/, "").replace(/\]$/, "");
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

async function resolveGeo(ip: string): Promise<{ location: GeoLocation | null; isp: ISPInfo | null }> {
  const includeGeo = process.env.ENABLE_GEOLOCATION === "true";
  const provider = process.env.GEOLOCATION_PROVIDER ?? "none";

  if (!includeGeo || provider === "none") {
    return { location: null, isp: null };
  }

  if (provider === "ipapi") {
    try {
      const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
        headers: {
          "User-Agent": "whats-my-ip-app/1.0",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return { location: null, isp: null };
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
        return { location: null, isp: null };
      }

      return {
        location: {
          city: parsed.data.city,
          region: parsed.data.region,
          country: parsed.data.country,
          timezone: parsed.data.timezone,
          coordinates: {
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
          },
        },
        isp: {
          name: parsed.data.isp,
          asn: parsed.data.asn,
          organization: parsed.data.org,
        },
      };
    } catch {
      return { location: null, isp: null };
    }
  }

  return { location: null, isp: null };
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
      warnings.push(
        "Geolocation unavailable. Set ENABLE_GEOLOCATION=true and GEOLOCATION_PROVIDER=ipapi for opt-in third-party lookup.",
      );
    }
  }

  return {
    ip: candidate.ip,
    ipVersion,
    ipv4: ipVersion === "IPv4" ? candidate.ip : null,
    ipv6: ipVersion === "IPv6" ? candidate.ip : null,
    isPublic: category === "Public",
    source: candidate.source as IPSource,
    category,
    timestamp: new Date().toISOString(),
    warnings,
    location,
    isp,
    request: {
      userAgent: hdrs.get("user-agent") ?? "Unknown",
      language: hdrs.get("accept-language")?.split(",")[0] ?? "Unknown",
      protocol: hdrs.get("x-forwarded-proto") === "https" ? "https" : "http",
    },
  };
}

export function isValidDetection(result: IPInfo): boolean {
  return result.ip !== "0.0.0.0" && result.ipVersion !== "Unknown";
}