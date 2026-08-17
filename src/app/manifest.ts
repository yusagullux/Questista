import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Questista — One question. Many perspectives.",
    short_name: "Questista",
    description:
      "Every day, one question for everyone. Answer it publicly or privately, see how others think, and build your confidence over time.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe3",
    theme_color: "#9c2b2b",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}