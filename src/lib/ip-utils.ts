import ipaddr from "ipaddr.js";

export function stripPort(value: string): string {
  const ip = value.trim();

  if (/^\[[0-9a-fA-F:]+\]:\d+$/.test(ip)) {
    return ip.slice(1, ip.lastIndexOf("]"));
  }

  if (ip.includes(".") && ip.includes(":")) {
    return ip.slice(0, ip.lastIndexOf(":"));
  }

  return ip;
}

export function isValidIP(ip: string): boolean {
  return ipaddr.isValid(stripPort(ip));
}

export function detectIPVersion(ip: string): "IPv4" | "IPv6" | "Unknown" {
  const clean = stripPort(ip);
  if (!ipaddr.isValid(clean)) return "Unknown";
  return ipaddr.parse(clean).kind() === "ipv4" ? "IPv4" : "IPv6";
}

function parseSafe(ip: string): ipaddr.IPv4 | ipaddr.IPv6 | null {
  const clean = stripPort(ip);
  if (!ipaddr.isValid(clean)) return null;
  return ipaddr.parse(clean);
}

export function isPrivateIP(ip: string): boolean {
  const parsed = parseSafe(ip);
  if (!parsed) return false;

  const range = parsed.range();
  const privateRanges = new Set([
    "private",
    "loopback",
    "linkLocal",
    "uniqueLocal",
    "unspecified",
    "broadcast",
    "carrierGradeNat",
  ]);

  return privateRanges.has(range);
}

export function isCGNAT(ip: string): boolean {
  const parsed = parseSafe(ip);
  if (!parsed || parsed.kind() !== "ipv4") return false;
  return parsed.match(ipaddr.parseCIDR("100.64.0.0/10"));
}

export function getIPCategory(
  ip: string,
): "Public" | "Private" | "CGNAT" | "Loopback" | "Link-Local" {
  const parsed = parseSafe(ip);
  if (!parsed) return "Private";

  if (isCGNAT(ip)) return "CGNAT";

  const range = parsed.range();
  if (range === "loopback") return "Loopback";
  if (range === "linkLocal") return "Link-Local";
  if (isPrivateIP(ip)) return "Private";

  return "Public";
}