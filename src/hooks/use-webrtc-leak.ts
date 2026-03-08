"use client";

import { useCallback, useState } from "react";
import type { WebRTCLeakResult } from "@/types";

const STUN_SERVERS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

const IP_REGEX = /(\d{1,3}(?:\.\d{1,3}){3}|[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){7})/;
const PRIVATE_REGEX = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|127\.|::1|fe80:)/;

function extractIP(candidate: string): string | null {
  const match = candidate.match(IP_REGEX);
  return match?.[1] ?? null;
}

function isPrivate(ip: string): boolean {
  return PRIVATE_REGEX.test(ip);
}

const INITIAL: WebRTCLeakResult = {
  supported: false,
  leaking: false,
  localIPs: [],
  publicIPs: [],
  error: null,
};

export function useWebRTCLeak() {
  const [result, setResult] = useState<WebRTCLeakResult>(INITIAL);
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(() => {
    if (typeof window === "undefined") return;

    const RTCPeerConnection =
      window.RTCPeerConnection ??
      (window as unknown as Record<string, unknown>).webkitRTCPeerConnection ??
      (window as unknown as Record<string, unknown>).mozRTCPeerConnection;

    if (!RTCPeerConnection) {
      setResult({ ...INITIAL, supported: false, error: "WebRTC not supported" });
      return;
    }

    setScanning(true);
    const localIPs = new Set<string>();
    const publicIPs = new Set<string>();

    try {
      const pc = new (RTCPeerConnection as typeof window.RTCPeerConnection)({
        iceServers: [{ urls: STUN_SERVERS }],
      });

      pc.createDataChannel("");

      pc.onicecandidate = (event) => {
        if (!event.candidate?.candidate) return;

        const ip = extractIP(event.candidate.candidate);
        if (!ip) return;

        if (isPrivate(ip)) {
          localIPs.add(ip);
        } else {
          publicIPs.add(ip);
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") {
          pc.close();
          const leaking = localIPs.size > 0 || publicIPs.size > 0;
          setResult({
            supported: true,
            leaking,
            localIPs: [...localIPs],
            publicIPs: [...publicIPs],
            error: null,
          });
          setScanning(false);
        }
      };

      // Timeout fallback — some browsers never fire "complete"
      setTimeout(() => {
        if (pc.iceGatheringState !== "complete") {
          pc.close();
          const leaking = localIPs.size > 0 || publicIPs.size > 0;
          setResult({
            supported: true,
            leaking,
            localIPs: [...localIPs],
            publicIPs: [...publicIPs],
            error: null,
          });
          setScanning(false);
        }
      }, 5_000);

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          pc.close();
          setResult({ ...INITIAL, supported: true, error: "Failed to create WebRTC offer" });
          setScanning(false);
        });
    } catch {
      setResult({ ...INITIAL, supported: true, error: "WebRTC scan failed" });
      setScanning(false);
    }
  }, []);

  return { result, scanning, scan };
}
