import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1119",
        color: "#33c2c4",
        fontSize: 72,
        fontWeight: 700,
        letterSpacing: -2,
      }}
    >
      IP
    </div>,
    size,
  );
}
