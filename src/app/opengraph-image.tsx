import { ImageResponse } from "next/og";

/* Default site OG image — brand mark + tagline. Per-route opengraph-image
   files override this for specific segments (e.g. profile pages). */
export const alt = "Questista — One question. Many perspectives.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbfaf7",
          position: "relative",
        }}
      >
        {/* Soft brand glow */}
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(91,61,245,0.10), rgba(245,166,35,0.06) 60%, transparent 70%)",
            top: -300,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg, #5b3df5, #f5a623)",
              boxShadow: "0 12px 40px rgba(91,61,245,0.25)",
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#1a1726", letterSpacing: -1 }}>
            Questista
          </div>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: "#1a1726",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 920,
          }}
        >
          One question. Many perspectives.
        </div>
        <div style={{ fontSize: 30, color: "#6b6478", marginTop: 28 }}>
          A quiet daily ritual for shared reflection.
        </div>
      </div>
    ),
    { ...size },
  );
}