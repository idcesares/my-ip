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
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 24,
        padding: "56px 72px",
        color: "#eef1ec",
        background: "#0b1119",
        border: "2px solid #22303b",
      }}
    >
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
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        What&apos;s My IP?
      </div>
      <div style={{ display: "flex", fontSize: 34, color: "#93a0a6" }}>
        Privacy-first IP, network, browser, and security diagnostics.
      </div>
      <div style={{ display: "flex", fontSize: 26, color: "#93a0a6" }}>
        by Isaac D&apos;Césares · dcesares.dev
      </div>
    </div>,
    size,
  );
}
