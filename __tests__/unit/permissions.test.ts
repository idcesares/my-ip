import { describe, expect, it } from "vitest";
import { BLOCKED_BY_SITE_POLICY, describePermission } from "@/lib/permissions";

const POLICY = "geolocation=(), microphone=(), camera=()";

describe("describePermission", () => {
  it("attributes denial to this site's policy when it disables the feature", () => {
    for (const key of ["geolocation", "camera", "microphone"] as const) {
      expect(describePermission(key, "denied", POLICY)).toBe(
        BLOCKED_BY_SITE_POLICY,
      );
    }
  });

  it("reports the plain state when the policy does not disable the feature", () => {
    expect(describePermission("geolocation", "denied", "camera=()")).toBe(
      "Denied",
    );
    expect(describePermission("geolocation", "denied", null)).toBe("Denied");
    expect(describePermission("camera", "prompt", POLICY)).toBe("Prompt");
  });

  it("never reinterprets notifications, which have no policy feature", () => {
    expect(describePermission("notifications", "denied", POLICY)).toBe(
      "Denied",
    );
    expect(describePermission("notifications", "prompt", POLICY)).toBe(
      "Prompt",
    );
  });

  it("reports unsupported and error readings", () => {
    expect(describePermission("camera", "unsupported", POLICY)).toBe(
      "Unsupported",
    );
    expect(describePermission("camera", "error", POLICY)).toBe("Unavailable");
  });
});
