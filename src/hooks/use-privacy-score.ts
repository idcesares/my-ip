"use client";

import { useMemo } from "react";
import {
  computeDiagnosticAssessment,
  type DiagnosticAssessment,
} from "@/lib/privacy-score";
import type { WebRTCAssessment } from "@/lib/webrtc-diagnostics";
import type { BrowserDiagnosticsSnapshot, IPInfo } from "@/types";

export function useDiagnosticAssessment(
  ip: IPInfo | null,
  diagnostics: BrowserDiagnosticsSnapshot | null,
  webrtc: WebRTCAssessment,
): DiagnosticAssessment | null {
  return useMemo(
    () => computeDiagnosticAssessment(ip, diagnostics, webrtc),
    [ip, diagnostics, webrtc],
  );
}
