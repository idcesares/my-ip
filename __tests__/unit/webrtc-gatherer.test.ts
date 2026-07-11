import { afterEach, describe, expect, it } from "vitest";
import { resolvePeerConnectionFactory } from "@/lib/webrtc-gatherer";

const windowRecord = window as unknown as Record<string, unknown>;
const original = windowRecord.RTCPeerConnection;

afterEach(() => {
  windowRecord.RTCPeerConnection = original;
});

describe("resolvePeerConnectionFactory", () => {
  it("returns null when no RTCPeerConnection constructor is available", () => {
    windowRecord.RTCPeerConnection = undefined;
    expect(resolvePeerConnectionFactory()).toBeNull();
  });

  it("wraps window.RTCPeerConnection when present", () => {
    class FakeRTCPeerConnection {
      config: unknown;
      constructor(config: unknown) {
        this.config = config;
      }
    }
    windowRecord.RTCPeerConnection = FakeRTCPeerConnection;

    const factory = resolvePeerConnectionFactory();
    expect(factory).not.toBeNull();
    const instance = factory?.({ iceServers: [] });
    expect(instance).toBeInstanceOf(FakeRTCPeerConnection);
  });
});
