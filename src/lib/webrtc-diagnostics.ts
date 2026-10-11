import ipaddr from "ipaddr.js";
import { canObserveFamily } from "@/lib/address-family";
import type {
  IPInfo,
  WebRTCCandidateObservation,
  WebRTCLeakResult,
} from "@/types";

export type WebRTCAssessmentStatus =
  | "not-run"
  | "unavailable"
  | "none-observed"
  | "expected-address"
  | "unobservable-family"
  | "additional-exposure";

export interface WebRTCAssessment {
  status: WebRTCAssessmentStatus;
  attention: boolean;
  summary: string;
  expectedPublicAddresses: string[];
  additionalPublicAddresses: string[];
  /** Public addresses of a family this host can never observe on a request. */
  unobservableFamilyAddresses: string[];
  privateAddresses: string[];
  maskedHostnames: string[];
  otherAddresses: string[];
  timedOut: boolean;
}

const PRIVATE_RANGES = new Set([
  "private",
  "loopback",
  "linkLocal",
  "uniqueLocal",
  "carrierGradeNat",
]);

export function canonicalizeCandidateAddress(address: string): string {
  const clean = address.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!ipaddr.isValid(clean)) return clean.toLowerCase();
  const parsed = ipaddr.parse(clean);
  if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
    return parsed.toIPv4Address().toString();
  }
  return parsed.toString();
}

export function classifyCandidateAddress(
  address: string,
): WebRTCCandidateObservation["addressKind"] {
  const canonical = canonicalizeCandidateAddress(address);
  if (canonical.endsWith(".local")) return "mdns";
  if (!ipaddr.isValid(canonical)) return "unknown";
  const range = ipaddr.parse(canonical).range();
  if (PRIVATE_RANGES.has(range)) return "private";
  return range === "unicast" ? "public" : "special";
}

export function parseCandidateLineAddress(
  candidateLine: string,
): string | null {
  const fields = candidateLine.trim().split(/\s+/);
  return fields.length >= 6 && fields[0]?.startsWith("candidate:")
    ? (fields[4] ?? null)
    : null;
}

export function assessWebRTCExposure(
  result: WebRTCLeakResult | null,
  ip: IPInfo | null,
): WebRTCAssessment {
  const empty = {
    expectedPublicAddresses: [],
    additionalPublicAddresses: [],
    unobservableFamilyAddresses: [],
    privateAddresses: [],
    maskedHostnames: [],
    otherAddresses: [],
    timedOut: result?.timedOut ?? false,
  };

  if (!result || !result.completed) {
    return {
      ...empty,
      status: "not-run",
      attention: false,
      summary:
        "Not tested. Start the WebRTC candidate test to compare its observations with this HTTP request.",
    };
  }

  if (result.error) {
    return {
      ...empty,
      status: "unavailable",
      attention: false,
      summary: result.error,
    };
  }

  const reachable = new Set(
    [ip?.ip, ip?.ipv4, ip?.ipv6]
      .filter((value): value is string => Boolean(value))
      .map(canonicalizeCandidateAddress),
  );
  const expectedPublicAddresses = new Set<string>();
  const additionalPublicAddresses = new Set<string>();
  const unobservableFamilyAddresses = new Set<string>();
  const privateAddresses = new Set<string>();
  const maskedHostnames = new Set<string>();
  const otherAddresses = new Set<string>();

  for (const candidate of result.candidates) {
    const address = canonicalizeCandidateAddress(candidate.address);
    if (candidate.addressKind === "public") {
      const family =
        ipaddr.isValid(address) && ipaddr.parse(address).kind() === "ipv6"
          ? "IPv6"
          : "IPv4";
      if (reachable.has(address)) {
        expectedPublicAddresses.add(address);
      } else if (ip && !canObserveFamily(ip, family)) {
        // The HTTP request could never have used this family, so a mismatch
        // does not show the address is exposed beyond the request address.
        unobservableFamilyAddresses.add(address);
      } else {
        additionalPublicAddresses.add(address);
      }
    } else if (candidate.addressKind === "private") {
      privateAddresses.add(address);
    } else if (candidate.addressKind === "mdns") {
      maskedHostnames.add(address);
    } else {
      otherAddresses.add(address);
    }
  }

  const groups = {
    expectedPublicAddresses: [...expectedPublicAddresses],
    additionalPublicAddresses: [...additionalPublicAddresses],
    unobservableFamilyAddresses: [...unobservableFamilyAddresses],
    privateAddresses: [...privateAddresses],
    maskedHostnames: [...maskedHostnames],
    otherAddresses: [...otherAddresses],
    timedOut: result.timedOut,
  };
  const additionalCount =
    additionalPublicAddresses.size + privateAddresses.size;

  if (additionalCount > 0) {
    const parts = [];
    if (additionalPublicAddresses.size > 0) {
      parts.push(
        `${additionalPublicAddresses.size} additional public address${additionalPublicAddresses.size === 1 ? "" : "es"}`,
      );
    }
    if (privateAddresses.size > 0) {
      parts.push(
        `${privateAddresses.size} literal private address${privateAddresses.size === 1 ? "" : "es"}`,
      );
    }
    return {
      ...groups,
      status: "additional-exposure",
      attention: true,
      summary: `WebRTC exposed ${parts.join(" and ")} beyond the address used for this HTTP request.`,
    };
  }

  if (unobservableFamilyAddresses.size > 0) {
    const count = unobservableFamilyAddresses.size;
    return {
      ...groups,
      status: "unobservable-family",
      attention: false,
      summary: `WebRTC revealed ${count} public IPv6 address${count === 1 ? "" : "es"} that this site cannot compare with your HTTP address, because it is served over IPv4 only. This is not a leak by itself; if a VPN should hide your IPv6 address, check that ${count === 1 ? "it matches" : "they match"} the address your VPN reports.`,
    };
  }

  if (expectedPublicAddresses.size > 0 || maskedHostnames.size > 0) {
    return {
      ...groups,
      status: "expected-address",
      attention: false,
      summary:
        expectedPublicAddresses.size > 0
          ? "WebRTC exposed only the same public address already used for this HTTP request."
          : "The browser masked local host candidates with mDNS names; no literal IP address was exposed.",
    };
  }

  return {
    ...groups,
    status: "none-observed",
    attention: false,
    summary:
      "No literal or mDNS candidate address was observable during this test.",
  };
}
