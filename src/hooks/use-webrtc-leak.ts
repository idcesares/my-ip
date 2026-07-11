"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const STUN_SERVERS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

const INITIAL: WebRTCLeakResult = {
  supported: false,
  completed: false,
  timedOut: false,
  candidates: [],
  error: null,
};

export function useWebRTCLeak(ip: IPInfo | null) {
  const [result, setResult] = useState<WebRTCLeakResult>(INITIAL);
  const [scanning, setScanning] = useState(false);
  const cancelActiveRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelActiveRef.current?.(), []);

  const scan = useCallback(() => {
    if (typeof window === "undefined") return;
    cancelActiveRef.current?.();

    const PeerConnection =
      window.RTCPeerConnection ??
      (window as unknown as Record<string, unknown>).webkitRTCPeerConnection ??
      (window as unknown as Record<string, unknown>).mozRTCPeerConnection;

    if (!PeerConnection) {
      setResult({
        ...INITIAL,
        completed: true,
        error: "WebRTC is not supported by this browser.",
      });
      return;
    }

    setScanning(true);
    setResult(INITIAL);
    const observations = new Map<string, WebRTCCandidateObservation>();
    let finished = false;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pc: RTCPeerConnection | null = null;

    const finish = (timedOut: boolean, error: string | null = null) => {
      if (finished || cancelled) return;
      finished = true;
      if (timeoutId) clearTimeout(timeoutId);
      pc?.close();
      setResult({
        supported: true,
        completed: true,
        timedOut,
        candidates: [...observations.values()],
        error,
      });
      setScanning(false);
    };

    cancelActiveRef.current = () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      pc?.close();
    };

    try {
      pc = new (PeerConnection as typeof window.RTCPeerConnection)({
        iceServers: [{ urls: STUN_SERVERS }],
      });
      pc.createDataChannel("");
      pc.onicecandidate = (event) => {
        const candidate = event.candidate;
        if (!candidate) return;
        const address =
          candidate.address ?? parseCandidateLineAddress(candidate.candidate);
        if (!address) return;
        const canonical = canonicalizeCandidateAddress(address);
        const observation: WebRTCCandidateObservation = {
          address: canonical,
          addressKind: classifyCandidateAddress(canonical),
          candidateType: candidate.type,
          protocol: candidate.protocol,
        };
        observations.set(
          `${observation.address}|${observation.candidateType}|${observation.protocol}`,
          observation,
        );
      };
      pc.onicegatheringstatechange = () => {
        if (pc?.iceGatheringState === "complete") finish(false);
      };
      timeoutId = setTimeout(() => finish(true), 5_000);
      void pc
        .createOffer()
        .then((offer) => pc?.setLocalDescription(offer))
        .catch(() =>
          finish(false, "The browser could not create a WebRTC offer."),
        );
    } catch {
      finish(false, "The WebRTC candidate test could not start.");
    }
  }, []);

  const assessment = useMemo(
    () => assessWebRTCExposure(result, ip),
    [ip, result],
  );

  return { result, assessment, scanning, scan };
}
