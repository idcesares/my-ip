import { ImageResponse } from "next/og";

export const alt = "What's My IP? by Isaac D'Césares";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        color: "#eef1ec",
        background: "#0b1119",
        border: "2px solid #22303b",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            border: "2px solid #eef1ec",
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          IP
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#93a0a6",
          }}
        >
          What&apos;s My IP — Network Diagnostics
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#35c483",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#35c483",
            }}
          />
          Live · No tracking · No analytics
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          What&apos;s My IP?
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            maxWidth: 920,
            color: "#93a0a6",
          }}
        >
          Instant IP visibility with browser-reported network, security, and
          privacy signals. No tracking.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          color: "#93a0a6",
          borderTop: "1px solid #22303b",
          paddingTop: 24,
        }}
      >
        <div style={{ display: "flex" }}>© 2026 Isaac D&apos;Césares</div>
        <div style={{ display: "flex" }}>dcesares.dev</div>
      </div>
    </div>,
    size,
  );
}
