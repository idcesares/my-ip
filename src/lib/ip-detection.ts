import { geolocation, ipAddress } from "@vercel/functions";
import ipaddr from "ipaddr.js";
import {
  detectIPVersion,
  getIPCategory,
  isPublicIP,
  stripPort,
} from "@/lib/ip-utils";
import type { GeoLocation, IPInfo } from "@/types";

type Candidate = {
  ip: string;
  source: IPInfo["source"];
  provenance: IPInfo["provenance"];
};

function canonicalizeIP(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  const clean = ipaddr.isValid(trimmed) ? trimmed : stripPort(trimmed);
  if (!ipaddr.isValid(clean)) return null;

  const parsed = ipaddr.parse(clean);
  if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
    return parsed.toIPv4Address().toString();
  }

  return parsed.toString();
}

function parseForwardedFor(value: string): string[] {
  const candidates: string[] = [];

  for (const element of value.split(",")) {
    const match = element.match(
      /(?:^|;)\s*for=(?:"\[([^\]]+)\](?::\d+)?"|\[([^\]]+)\](?::\d+)?|"?([^;,\s"]+)"?)/i,
    );
    const candidate = canonicalizeIP(match?.[1] ?? match?.[2] ?? match?.[3]);
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

function pickFromList(value: string | null): string | null {
  if (!value) return null;

  const candidates = value
    .split(",")
    .map((part) => canonicalizeIP(part))
    .filter((candidate): candidate is string => candidate !== null);

  return candidates.find(isPublicIP) ?? candidates[0] ?? null;
}

/**
 * Vercel overwrites X-Forwarded-For and does not forward external client IPs,
 * so behind another proxy its value is that proxy's address. Cloudflare marks
 * its requests with these headers; seeing them on Vercel means the reported
 * address is probably a Cloudflare edge IP. A client can inject the headers,
 * but that only lowers confidence in its own response and never changes the IP.
 */
function hasCloudflareProxyHeaders(request: Request): boolean {
  return (
    request.headers.has("cf-connecting-ip") ||
    request.headers.has("cf-ray") ||
    /cloudflare/i.test(request.headers.get("cdn-loop") ?? "")
  );
}

/**
 * Observe the request through one deployment-aware seam. Vercel's helper is
 * authoritative in production because the platform overwrites its client-IP
 * header. Other proxy headers are deliberately lower-trust fallbacks.
 */
export function observeRequest(request: Request): Candidate {
  if (process.env.VERCEL) {
    const vercelIP = canonicalizeIP(ipAddress(request));
    if (vercelIP) {
      return {
        ip: vercelIP,
        source: "x-real-ip",
        provenance: {
          provider: "vercel",
          header: "x-real-ip",
          trusted: true,
          forwarded: true,
        },
      };
    }

    return {
      ip: "0.0.0.0",
      source: "fallback",
      provenance: {
        provider: "none",
        header: null,
        trusted: false,
        forwarded: false,
      },
    };
  }

  if (process.env.TRUSTED_PROXY_MODE === "cloudflare") {
    const cloudflareIP = canonicalizeIP(
      request.headers.get("cf-connecting-ip"),
    );
    if (cloudflareIP) {
      return {
        ip: cloudflareIP,
        source: "cloudflare",
        provenance: {
          provider: "cloudflare",
          header: "cf-connecting-ip",
          trusted: true,
          forwarded: true,
        },
      };
    }

    return {
      ip: "0.0.0.0",
      source: "fallback",
      provenance: {
        provider: "none",
        header: null,
        trusted: false,
        forwarded: false,
      },
    };
  }

  const xRealIP = canonicalizeIP(request.headers.get("x-real-ip"));
  if (xRealIP) {
    return {
      ip: xRealIP,
      source: "x-real-ip",
      provenance: {
        provider: "standard-forwarded",
        header: "x-real-ip",
        trusted: false,
        forwarded: true,
      },
    };
  }

  const xForwardedFor = pickFromList(request.headers.get("x-forwarded-for"));
  if (xForwardedFor) {
    return {
      ip: xForwardedFor,
      source: "x-forwarded-for",
      provenance: {
        provider: "standard-forwarded",
        header: "x-forwarded-for",
        trusted: false,
        forwarded: true,
      },
    };
  }

  const forwardedFor = request.headers.get("forwarded");
  const forwardedIP = forwardedFor ? parseForwardedFor(forwardedFor)[0] : null;
  if (forwardedIP) {
    return {
      ip: forwardedIP,
      source: "forwarded",
      provenance: {
        provider: "standard-forwarded",
        header: "forwarded",
        trusted: false,
        forwarded: true,
      },
    };
  }

  return {
    ip: "0.0.0.0",
    source: "fallback",
    provenance: {
      provider: "none",
      header: null,
      trusted: false,
      forwarded: false,
    },
  };
}

function finiteCoordinate(
  value: string | undefined,
  minimum: number,
  maximum: number,
): number | null {
  if (value === undefined || value.trim() === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) &&
    coordinate >= minimum &&
    coordinate <= maximum
    ? coordinate
    : null;
}

function resolveVercelGeo(request: Request): GeoLocation | null {
  try {
    const geo = geolocation(request);
    const latitude = finiteCoordinate(geo.latitude, -90, 90);
    const longitude = finiteCoordinate(geo.longitude, -180, 180);
    const timezone = request.headers.get("x-vercel-ip-timezone");

    if (
      !geo.city &&
      !geo.countryRegion &&
      !geo.country &&
      !timezone &&
      latitude === null &&
      longitude === null
    ) {
      return null;
    }

    return {
      city: geo.city ?? null,
      region: geo.countryRegion ?? null,
      country: geo.country ?? null,
      timezone,
      coordinates: { latitude, longitude },
    };
  } catch {
    return null;
  }
}

export async function detectIP(
  request: Request,
  options?: { includeGeo?: boolean },
): Promise<IPInfo> {
  const warnings: string[] = [];
  const candidate = observeRequest(request);
  const ipVersion = detectIPVersion(candidate.ip);
  const category = getIPCategory(candidate.ip);

  if (category !== "Public") warnings.push(`Address category: ${category}`);
  if (!candidate.provenance.trusted && candidate.provenance.forwarded) {
    warnings.push(
      "IP came from an untrusted forwarding header and may be client-controlled.",
    );
  }
  const behindUpstreamProxy =
    candidate.provenance.provider === "vercel" &&
    hasCloudflareProxyHeaders(request);
  if (behindUpstreamProxy) {
    warnings.push(
      "Cloudflare headers were present; Vercel reports the connecting proxy's address, so this may be a Cloudflare edge IP rather than the client's.",
    );
  }
  if (candidate.source === "fallback" || ipVersion === "Unknown") {
    warnings.push(
      "Unable to determine a reliable public IP from request headers.",
    );
  }

  const location = options?.includeGeo ? resolveVercelGeo(request) : null;
  if (options?.includeGeo && !location)
    warnings.push("Vercel geolocation headers returned no data.");

  let protocol: "http" | "https" = "http";
  try {
    protocol = new URL(request.url).protocol === "https:" ? "https" : "http";
  } catch {
    // Request implementations normally guarantee a valid absolute URL.
  }

  return {
    ip: candidate.ip,
    ipVersion,
    ipv4: ipVersion === "IPv4" ? candidate.ip : null,
    ipv6: ipVersion === "IPv6" ? candidate.ip : null,
    isPublic: category === "Public",
    source: candidate.source,
    confidence:
      candidate.provenance.trusted && !behindUpstreamProxy ? "high" : "low",
    provenance: candidate.provenance,
    category,
    timestamp: new Date().toISOString(),
    warnings,
    location,
    isp: null,
    request: {
      userAgent: request.headers.get("user-agent") ?? "Unknown",
      language:
        request.headers.get("accept-language")?.split(",")[0] ?? "Unknown",
      protocol,
    },
  };
}

export function isValidDetection(result: IPInfo): boolean {
  return result.ip !== "0.0.0.0" && result.ipVersion !== "Unknown";
}
