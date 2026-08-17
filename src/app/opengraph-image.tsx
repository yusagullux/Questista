import { ImageResponse } from "next/og";

/* Default site OG image — almanac masthead: paper, stamp-red Q tile,
   Fraunces-style wordmark, mono dateline rule. Per-route opengraph-image
   files override this for specific segments. */
export const alt = "Questista — One question. Many perspectives.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f5efe3";
const INK = "#241d15";
const MUTED = "#6a5d4e";
const STAMP = "#9c2b2b";
const BORDER = "#d9cfb8";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: PAPER,
          padding: "0 80px",
          position: "relative",
        }}
      >
        {/* Dated masthead — hairlines + mono rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: MUTED,
            letterSpacing: 2,
            textTransform: "uppercase",
            borderBottom: `1px solid ${BORDER}`,
            borderTop: `1px solid ${BORDER}`,
            padding: "12px 0",
            marginBottom: 56,
          }}
        >
          <span>Questista · No. 229</span>
          <span>Mon 17 Aug 2026</span>
        </div>

        {/* Wordmark + stamp-red Q tile */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 48 }}>
          <div
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontWeight: 700,
              color: "#fff",
              background: STAMP,
              border: `3px solid ${STAMP}`,
              borderRadius: 6,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1 }}>Questista</div>
        </div>

        {/* Front-page headline */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            maxWidth: 880,
          }}
        >
          One question. Many perspectives.
        </div>

        {/* Short stamp-red rule */}
        <div style={{ width: 80, height: 3, background: STAMP, marginTop: 28, marginBottom: 24 }} />

        <div style={{ fontSize: 28, color: MUTED }}>A quiet daily ritual for shared reflection.</div>
      </div>
    ),
    { ...size },
  );
}