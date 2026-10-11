import { describe, expect, it } from "vitest";
import {
  assessWebRTCExposure,
  canonicalizeCandidateAddress,
  classifyCandidateAddress,
  parseCandidateLineAddress,
} from "@/lib/webrtc-diagnostics";
import type {
  IPInfo,
  WebRTCCandidateObservation,
  WebRTCLeakResult,
} from "@/types";

function ipInfo(overrides: Partial<IPInfo> = {}): IPInfo {
  return {
    ip: "8.8.8.8",
    ipVersion: "IPv4",
    ipv4: "8.8.8.8",
    ipv6: null,
    isPublic: true,
    source: "x-real-ip",
    confidence: "high",
    provenance: {
      provider: "vercel",
      header: "x-real-ip",
      trusted: true,
      forwarded: true,
    },
    category: "Public",
    timestamp: "2026-07-11T00:00:00.000Z",
    warnings: [],
    request: { userAgent: "test", language: "en", protocol: "https" },
    location: null,
    isp: null,
    ...overrides,
  };
}

function candidate(
  address: string,
  addressKind: WebRTCCandidateObservation["addressKind"],
): WebRTCCandidateObservation {
  return { address, addressKind, candidateType: "srflx", protocol: "udp" };
}

function result(
  candidates: WebRTCCandidateObservation[],
  timedOut = false,
): WebRTCLeakResult {
  return {
    supported: true,
    completed: true,
    timedOut,
    candidates,
    error: null,
  };
}

describe("WebRTC candidate parsing", () => {
  it("parses the connection address from an ICE candidate line", () => {
    expect(
      parseCandidateLineAddress(
        "candidate:1 1 UDP 2122260223 2001:4860:4860::8888 54400 typ host",
      ),
    ).toBe("2001:4860:4860::8888");
  });

  it("canonicalizes IPv4-mapped IPv6", () => {
    expect(canonicalizeCandidateAddress("::ffff:192.168.1.10")).toBe(
      "192.168.1.10",
    );
  });

  it.each([
    ["8.8.8.8", "public"],
    ["192.168.1.10", "private"],
    ["host-123.local", "mdns"],
    ["224.0.0.1", "special"],
    ["opaque-value", "unknown"],
  ] as const)("classifies %s as %s", (address, expected) => {
    expect(classifyCandidateAddress(address)).toBe(expected);
  });
});

describe("WebRTC exposure assessment", () => {
  it("does not call the current request address an additional leak", () => {
    const assessment = assessWebRTCExposure(
      result([candidate("8.8.8.8", "public")]),
      ipInfo(),
    );
    expect(assessment.status).toBe("expected-address");
    expect(assessment.attention).toBe(false);
    expect(assessment.expectedPublicAddresses).toEqual(["8.8.8.8"]);
  });

  it("flags a second public network identity of the same family", () => {
    const assessment = assessWebRTCExposure(
      result([candidate("8.8.8.8", "public"), candidate("1.1.1.1", "public")]),
      ipInfo(),
    );
    expect(assessment.status).toBe("additional-exposure");
    expect(assessment.attention).toBe(true);
    expect(assessment.additionalPublicAddresses).toEqual(["1.1.1.1"]);
  });

  it("does not flag a public IPv6 address on an IPv4-only host", () => {
    const assessment = assessWebRTCExposure(
      result([
        candidate("8.8.8.8", "public"),
        candidate("2001:4860:4860::8888", "public"),
      ]),
      ipInfo(),
    );
    expect(assessment.status).toBe("unobservable-family");
    expect(assessment.attention).toBe(false);
    expect(assessment.additionalPublicAddresses).toEqual([]);
    expect(assessment.unobservableFamilyAddresses).toEqual([
      "2001:4860:4860::8888",
    ]);
    expect(assessment.summary).toMatch(/cannot compare/);
    expect(assessment.summary).toMatch(/not a leak by itself/);
  });

  it("still flags a mismatched public IPv6 address on a host that can observe IPv6", () => {
    const assessment = assessWebRTCExposure(
      result([candidate("2001:db8::1", "public")]),
      ipInfo({
        ip: "2001:db8::2",
        ipVersion: "IPv6",
        ipv4: null,
        ipv6: "2001:db8::2",
        provenance: {
          provider: "cloudflare",
          header: "cf-connecting-ip",
          trusted: true,
          forwarded: true,
        },
      }),
    );
    expect(assessment.status).toBe("additional-exposure");
    expect(assessment.additionalPublicAddresses).toEqual(["2001:db8::1"]);
  });

  it("still treats a mismatched IPv4 address as additional exposure alongside an unobservable IPv6 one", () => {
    const assessment = assessWebRTCExposure(
      result([
        candidate("1.1.1.1", "public"),
        candidate("2001:4860:4860::8888", "public"),
      ]),
      ipInfo(),
    );
    expect(assessment.status).toBe("additional-exposure");
    expect(assessment.additionalPublicAddresses).toEqual(["1.1.1.1"]);
    expect(assessment.unobservableFamilyAddresses).toEqual([
      "2001:4860:4860::8888",
    ]);
  });

  it("flags literal private addresses but treats mDNS masking as informational", () => {
    const privateAssessment = assessWebRTCExposure(
      result([candidate("192.168.1.10", "private")]),
      ipInfo(),
    );
    expect(privateAssessment.attention).toBe(true);

    const maskedAssessment = assessWebRTCExposure(
      result([candidate("host-123.local", "mdns")]),
      ipInfo(),
    );
    expect(maskedAssessment.status).toBe("expected-address");
    expect(maskedAssessment.attention).toBe(false);
  });

  it("reports empty and partial timeout outcomes without overclaiming", () => {
    expect(assessWebRTCExposure(result([]), ipInfo()).status).toBe(
      "none-observed",
    );
    expect(assessWebRTCExposure(result([], true), ipInfo()).timedOut).toBe(
      true,
    );
  });

  it("keeps unsupported and failed tests unavailable", () => {
    const failed: WebRTCLeakResult = {
      supported: false,
      completed: true,
      timedOut: false,
      candidates: [],
      error: "WebRTC is unavailable",
    };
    expect(assessWebRTCExposure(failed, ipInfo()).status).toBe("unavailable");
  });
});
