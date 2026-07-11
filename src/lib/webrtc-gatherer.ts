export interface MinimalIceCandidate {
  candidate: string;
  address: string | null;
  type: "host" | "srflx" | "prflx" | "relay" | null;
  protocol: "udp" | "tcp" | null;
}

export interface MinimalIceEvent {
  candidate: MinimalIceCandidate | null;
}

export interface MinimalSessionDescription {
  type: string;
  sdp?: string;
}

export interface MinimalPeerConnection {
  createDataChannel(label: string): unknown;
  createOffer(): Promise<MinimalSessionDescription>;
  setLocalDescription(description: MinimalSessionDescription): Promise<void>;
  close(): void;
  iceGatheringState: string;
  onicecandidate: ((event: MinimalIceEvent) => void) | null;
  onicegatheringstatechange: (() => void) | null;
}

export type PeerConnectionFactory = (config: {
  iceServers: { urls: string[] }[];
}) => MinimalPeerConnection;

/**
 * Resolves the browser's real RTCPeerConnection constructor, covering the
 * vendor-prefixed variants some browsers still ship. Returns null when
 * WebRTC isn't available at all (no window, or no constructor found) so the
 * Active test can report "unsupported" instead of throwing.
 */
export function resolvePeerConnectionFactory(): PeerConnectionFactory | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.RTCPeerConnection ??
    (window as unknown as Record<string, unknown>).webkitRTCPeerConnection ??
    (window as unknown as Record<string, unknown>).mozRTCPeerConnection;
  if (!Ctor) return null;
  return (config) =>
    new (Ctor as typeof window.RTCPeerConnection)(
      config,
    ) as unknown as MinimalPeerConnection;
}
