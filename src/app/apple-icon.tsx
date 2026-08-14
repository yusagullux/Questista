import { ImageResponse } from "next/og";

/* Generated Apple touch icon — Q mark on brand gradient, rounded square. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 120,
          fontWeight: 700,
          color: "#fff",
          background: "linear-gradient(135deg, #5b3df5, #f5a623)",
          borderRadius: 44,
        }}
      >
        Q
      </div>
    ),
    { ...size },
  );
}