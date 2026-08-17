import { ImageResponse } from "next/og";

/* Generated Apple touch icon — stamp-red Q on paper, rounded square. */
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
          color: "#9c2b2b",
          background: "#f5efe3",
          border: "6px solid #9c2b2b",
          borderRadius: 40,
        }}
      >
        Q
      </div>
    ),
    { ...size },
  );
}