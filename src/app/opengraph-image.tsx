import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "What's My IP? by Isaac D'Césares";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 64px",
          color: "#0f172a",
          background:
            "radial-gradient(circle at 5% 0%, rgba(34,211,238,0.34), transparent 42%), radial-gradient(circle at 100% 8%, rgba(59,130,246,0.25), transparent 46%), #f5f9ff",
          border: "2px solid rgba(148,163,184,0.35)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "inline-flex",
              width: "fit-content",
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(15,23,42,0.2)",
              fontSize: 24,
              color: "#334155",
            }}
          >
            Privacy-First Diagnostics
          </div>
          <div style={{ fontSize: 86, fontWeight: 800, letterSpacing: -2 }}>
            What&apos;s My IP?
          </div>
          <div style={{ fontSize: 36, color: "#334155", maxWidth: "86%" }}>
            Instant IP, network, browser, and security visibility. No tracking.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#334155" }}>
          <div>© 2026 Isaac D&apos;Césares</div>
          <div>dcesares.dev</div>
        </div>
      </div>
    ),
    size,
  );
}
