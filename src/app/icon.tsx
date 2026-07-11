import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1119",
        borderRadius: 6,
        color: "#33c2c4",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: -0.5,
      }}
    >
      IP
    </div>,
    size,
  );
}
