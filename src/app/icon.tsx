import { ImageResponse } from "next/og";

/* Generated favicon — the Questista "Q" mark on the brand gradient. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          color: "#fff",
          background: "linear-gradient(135deg, #5b3df5, #f5a623)",
          borderRadius: 8,
        }}
      >
        Q
      </div>
    ),
    { ...size },
  );
}