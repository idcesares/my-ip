"use client";

import { useMemo } from "react";
import { computePrivacyScore } from "@/lib/privacy-score";
import type { BrowserDiagnostics, IPInfo, PrivacyScore, WebRTCLeakResult } from "@/types";

export function usePrivacyScore(
  ip: IPInfo | null,
  diagnostics: BrowserDiagnostics | null,
  webrtc: WebRTCLeakResult | null
): PrivacyScore | null {
  return useMemo(
    () => computePrivacyScore(ip, diagnostics, webrtc),
    [ip, diagnostics, webrtc]
  );
}
