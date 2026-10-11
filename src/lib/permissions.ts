import { disabledPermissionFeatures } from "@/lib/security-headers";

export type PermissionKey =
  "notifications" | "geolocation" | "camera" | "microphone";

export type PermissionReading = PermissionState | "unsupported" | "error";

/** Permissions-Policy feature that gates each permission, where one exists. */
const POLICY_FEATURE: Partial<Record<PermissionKey, string>> = {
  geolocation: "geolocation",
  camera: "camera",
  microphone: "microphone",
};

export const BLOCKED_BY_SITE_POLICY = "Blocked by this site's policy";

/**
 * `permissions.query` reports the page's effective state. When this site's own
 * Permissions-Policy disables a feature, the answer is "denied" regardless of
 * the visitor's browser setting, so it is reported as a site policy rather than
 * as something the visitor chose.
 */
export function describePermission(
  key: PermissionKey,
  state: PermissionReading,
  permissionsPolicy: string | null,
): string {
  if (state === "unsupported") return "Unsupported";
  if (state === "error") return "Unavailable";

  const feature = POLICY_FEATURE[key];
  if (
    state === "denied" &&
    feature &&
    disabledPermissionFeatures(permissionsPolicy).has(feature)
  ) {
    return BLOCKED_BY_SITE_POLICY;
  }
  return state.charAt(0).toUpperCase() + state.slice(1);
}
