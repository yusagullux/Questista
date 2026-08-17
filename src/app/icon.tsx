import { ImageResponse } from "next/og";

/* Generated favicon — stamp-red "Q" on paper. */
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
          color: "#9c2b2b",
          background: "#f5efe3",
          border: "2px solid #9c2b2b",
          borderRadius: 4,
        }}
      >
        Q
      </div>
    ),
    { ...size },
  );
}