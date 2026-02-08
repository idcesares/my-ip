import { describe, expect, it } from "vitest";
import { detectIPVersion, getIPCategory, isCGNAT, isPrivateIP, isValidIP, stripPort } from "@/lib/ip-utils";

describe("ip-utils", () => {
  it("validates IP strings", () => {
    expect(isValidIP("8.8.8.8")).toBe(true);
    expect(isValidIP("2001:db8::1")).toBe(true);
    expect(isValidIP("not-an-ip")).toBe(false);
  });

  it("detects versions", () => {
    expect(detectIPVersion("1.1.1.1")).toBe("IPv4");
    expect(detectIPVersion("::1")).toBe("IPv6");
    expect(detectIPVersion("x")).toBe("Unknown");
  });

  it("marks private and cgnat ranges", () => {
    expect(isPrivateIP("192.168.0.10")).toBe(true);
    expect(isPrivateIP("8.8.8.8")).toBe(false);
    expect(isCGNAT("100.64.2.1")).toBe(true);
    expect(isCGNAT("100.128.2.1")).toBe(false);
  });

  it("strips ports", () => {
    expect(stripPort("1.2.3.4:3000")).toBe("1.2.3.4");
    expect(stripPort("[2001:db8::1]:443")).toBe("2001:db8::1");
  });

  it("categorizes common cases", () => {
    expect(getIPCategory("127.0.0.1")).toBe("Loopback");
    expect(getIPCategory("100.64.0.1")).toBe("CGNAT");
    expect(getIPCategory("169.254.1.1")).toBe("Link-Local");
    expect(getIPCategory("8.8.8.8")).toBe("Public");
  });
});