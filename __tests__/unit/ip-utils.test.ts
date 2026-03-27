import { describe, expect, it } from "vitest";
import { detectIPVersion, getIPCategory, isCGNAT, isPrivateIP, isValidIP, stripPort } from "@/lib/ip-utils";

describe("ip-utils", () => {
  describe("isValidIP", () => {
    it("validates IPv4 addresses", () => {
      expect(isValidIP("8.8.8.8")).toBe(true);
      expect(isValidIP("192.168.1.1")).toBe(true);
      expect(isValidIP("0.0.0.0")).toBe(true);
    });

    it("validates IPv6 addresses", () => {
      expect(isValidIP("2001:db8::1")).toBe(true);
      expect(isValidIP("::1")).toBe(true);
      expect(isValidIP("fe80::1")).toBe(true);
    });

    it("rejects invalid strings", () => {
      expect(isValidIP("not-an-ip")).toBe(false);
      expect(isValidIP("999.999.999.999")).toBe(false);
      expect(isValidIP("")).toBe(false);
    });
  });

  describe("detectIPVersion", () => {
    it("detects IPv4", () => {
      expect(detectIPVersion("1.1.1.1")).toBe("IPv4");
      expect(detectIPVersion("10.0.0.1")).toBe("IPv4");
    });

    it("detects IPv6", () => {
      expect(detectIPVersion("::1")).toBe("IPv6");
      expect(detectIPVersion("2001:db8::1")).toBe("IPv6");
      expect(detectIPVersion("fe80::1")).toBe("IPv6");
    });

    it("returns Unknown for invalid input", () => {
      expect(detectIPVersion("x")).toBe("Unknown");
      expect(detectIPVersion("")).toBe("Unknown");
    });
  });

  describe("isPrivateIP", () => {
    it("identifies RFC 1918 private ranges", () => {
      expect(isPrivateIP("10.0.0.1")).toBe(true);
      expect(isPrivateIP("172.16.0.1")).toBe(true);
      expect(isPrivateIP("192.168.0.10")).toBe(true);
    });

    it("identifies loopback", () => {
      expect(isPrivateIP("127.0.0.1")).toBe(true);
    });

    it("identifies CGNAT range as private", () => {
      expect(isPrivateIP("100.64.0.1")).toBe(true);
    });

    it("rejects public IPs", () => {
      expect(isPrivateIP("8.8.8.8")).toBe(false);
      expect(isPrivateIP("203.0.113.42")).toBe(false);
    });

    it("handles IPv6 private ranges", () => {
      expect(isPrivateIP("::1")).toBe(true);
      expect(isPrivateIP("fe80::1")).toBe(true);
      expect(isPrivateIP("fc00::1")).toBe(true);
    });

    it("rejects public IPv6", () => {
      expect(isPrivateIP("2001:db8::1")).toBe(false);
    });

    it("returns false for invalid input", () => {
      expect(isPrivateIP("not-valid")).toBe(false);
      expect(isPrivateIP("")).toBe(false);
    });
  });

  describe("isCGNAT", () => {
    it("identifies CGNAT range (100.64.0.0/10)", () => {
      expect(isCGNAT("100.64.0.1")).toBe(true);
      expect(isCGNAT("100.100.50.25")).toBe(true);
    });

    it("detects CGNAT boundary: first address", () => {
      expect(isCGNAT("100.64.0.0")).toBe(true);
    });

    it("detects CGNAT boundary: last address", () => {
      expect(isCGNAT("100.127.255.255")).toBe(true);
    });

    it("rejects IPs outside CGNAT range", () => {
      expect(isCGNAT("100.128.0.1")).toBe(false);
      expect(isCGNAT("100.63.255.255")).toBe(false);
    });

    it("rejects IPv6 addresses", () => {
      expect(isCGNAT("::1")).toBe(false);
      expect(isCGNAT("2001:db8::1")).toBe(false);
    });
  });

  describe("stripPort", () => {
    it("strips port from IPv4:port", () => {
      expect(stripPort("1.2.3.4:3000")).toBe("1.2.3.4");
    });

    it("strips port from bracketed IPv6", () => {
      expect(stripPort("[2001:db8::1]:443")).toBe("2001:db8::1");
    });

    it("returns bare IP unchanged", () => {
      expect(stripPort("8.8.8.8")).toBe("8.8.8.8");
      expect(stripPort("2001:db8::1")).toBe("2001:db8::1");
    });

    it("trims whitespace", () => {
      expect(stripPort("  8.8.8.8  ")).toBe("8.8.8.8");
    });

    it("handles empty string", () => {
      expect(stripPort("")).toBe("");
    });

    it("strips IPv6 zone ID", () => {
      expect(stripPort("fe80::1%eth0")).toBe("fe80::1");
      expect(stripPort("fe80::1%25eth0")).toBe("fe80::1");
    });

    it("strips zone ID from bracketed IPv6 with port", () => {
      expect(stripPort("[fe80::1%25eth0]:443")).toBe("fe80::1");
    });
  });

  describe("detectIPVersion — edge cases", () => {
    it("detects IPv4-mapped IPv6 as IPv6", () => {
      expect(detectIPVersion("::ffff:192.168.1.1")).toBe("IPv6");
    });

    it("handles IPv6 with stripped zone ID", () => {
      // After zone ID stripping, fe80::1 should be valid IPv6
      expect(detectIPVersion("fe80::1%eth0")).toBe("IPv6");
    });
  });

  describe("getIPCategory", () => {
    it("categorizes loopback", () => {
      expect(getIPCategory("127.0.0.1")).toBe("Loopback");
      expect(getIPCategory("::1")).toBe("Loopback");
    });

    it("categorizes CGNAT", () => {
      expect(getIPCategory("100.64.0.1")).toBe("CGNAT");
    });

    it("categorizes link-local", () => {
      expect(getIPCategory("169.254.1.1")).toBe("Link-Local");
      expect(getIPCategory("fe80::1")).toBe("Link-Local");
    });

    it("categorizes private ranges", () => {
      expect(getIPCategory("192.168.1.1")).toBe("Private");
      expect(getIPCategory("10.0.0.1")).toBe("Private");
    });

    it("categorizes public IPs", () => {
      expect(getIPCategory("8.8.8.8")).toBe("Public");
      expect(getIPCategory("203.0.113.42")).toBe("Public");
    });

    it("returns Private for invalid input", () => {
      expect(getIPCategory("")).toBe("Private");
      expect(getIPCategory("not-valid")).toBe("Private");
    });
  });
});
