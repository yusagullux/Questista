import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { Nav } from "./components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: {
    default: "Questista — One question. Many perspectives.",
    template: "%s · Questista",
  },
  description:
    "Every day, one question for everyone. Answer it publicly or privately, see how others think, and build your confidence over time.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Questista — One question. Many perspectives.",
    description:
      "A daily social ritual. Answer one question a day, publicly or privately.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b3df5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}