import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWebRTCLeak } from "@/hooks/use-webrtc-leak";
import type {
  MinimalIceEvent,
  MinimalPeerConnection,
  PeerConnectionFactory,
} from "@/lib/webrtc-gatherer";

class FakePeerConnection implements MinimalPeerConnection {
  iceGatheringState = "new";
  onicecandidate: ((event: MinimalIceEvent) => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  closed = false;

  createDataChannel() {
    return {};
  }

  async createOffer() {
    return { type: "offer" };
  }

  async setLocalDescription() {}

  close() {
    this.closed = true;
  }
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useWebRTCLeak", () => {
  it("reports unsupported when no PeerConnection implementation resolves", () => {
    const { result } = renderHook(() => useWebRTCLeak(null, null));

    act(() => {
      result.current.scan();
    });

    expect(result.current.result.error).toBe(
      "WebRTC is not supported by this browser.",
    );
    expect(result.current.scanning).toBe(false);
  });

  it("dedupes repeated candidates and finishes when gathering completes", async () => {
    const pc = new FakePeerConnection();
    const factory: PeerConnectionFactory = () => pc;
    const { result } = renderHook(() => useWebRTCLeak(null, factory));

    act(() => {
      result.current.scan();
    });
    await flushMicrotasks();

    act(() => {
      const candidate = {
        candidate: "candidate:1 1 UDP 1 8.8.8.8 1 typ srflx",
        address: "8.8.8.8",
        type: "srflx" as const,
        protocol: "udp" as const,
      };
      pc.onicecandidate?.({ candidate });
      pc.onicecandidate?.({ candidate });
      pc.iceGatheringState = "complete";
      pc.onicegatheringstatechange?.();
    });

    expect(result.current.result.candidates).toHaveLength(1);
    expect(result.current.result.candidates[0]?.address).toBe("8.8.8.8");
    expect(result.current.result.completed).toBe(true);
    expect(result.current.result.timedOut).toBe(false);
    expect(result.current.scanning).toBe(false);
    expect(pc.closed).toBe(true);
  });

  it("times out after five seconds and reports partial results", async () => {
    vi.useFakeTimers();
    const pc = new FakePeerConnection();
    const factory: PeerConnectionFactory = () => pc;
    const { result } = renderHook(() => useWebRTCLeak(null, factory));

    act(() => {
      result.current.scan();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.result.timedOut).toBe(true);
    expect(result.current.result.completed).toBe(true);
    expect(pc.closed).toBe(true);
  });

  it("cancels an in-flight scan when a new one starts", async () => {
    const firstPc = new FakePeerConnection();
    const secondPc = new FakePeerConnection();
    const pcs = [firstPc, secondPc];
    const factory: PeerConnectionFactory = () => pcs.shift()!;
    const { result } = renderHook(() => useWebRTCLeak(null, factory));

    act(() => {
      result.current.scan();
    });
    await flushMicrotasks();

    act(() => {
      result.current.scan();
    });
    await flushMicrotasks();

    expect(firstPc.closed).toBe(true);
    expect(secondPc.closed).toBe(false);
  });
});
