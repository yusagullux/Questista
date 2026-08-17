import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { Nav } from "./components/nav";
import { Footer } from "./components/footer";
import { Toaster } from "./components/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "Every day, one question for everyone. Answer it publicly or privately, see how others think, and build your confidence over time.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Questista — One question. Many perspectives.",
    template: "%s · Questista",
  },
  description,
  applicationName: "Questista",
  keywords: [
    "daily question",
    "journaling",
    "reflection",
    "social answers",
    "community",
    "perspectives",
    "confidence",
  ],
  authors: [{ name: "Questista" }],
  openGraph: {
    title: "Questista — One question. Many perspectives.",
    description,
    type: "website",
    siteName: "Questista",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Questista — One question. Many perspectives.",
    description,
  },
  robots: {
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "social",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe3" },
    { media: "(prefers-color-scheme: dark)", color: "#19150f" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}