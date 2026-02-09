import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "What's My IP? by Isaac D'Césares";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
          padding: "48px 64px",
          color: "#0f172a",
          background:
            "radial-gradient(circle at 8% 0%, rgba(34,211,238,0.32), transparent 40%), radial-gradient(circle at 100% 100%, rgba(14,165,233,0.22), transparent 40%), #f8fbff",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>What&apos;s My IP?</div>
        <div style={{ fontSize: 34, maxWidth: "85%", color: "#334155" }}>
          Privacy-first IP, network, browser, and security diagnostics.
        </div>
        <div style={{ fontSize: 26, color: "#475569" }}>by Isaac D&apos;Césares · dcesares.dev</div>
      </div>
    ),
    size,
  );
}
