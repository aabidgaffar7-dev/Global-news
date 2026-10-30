import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import { BRAND_NAME } from "@/lib/brand";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// One env var flips the whole site to a custom domain: absolute URLs in
// metadata (OG/Twitter), the sitemap, and robots all derive from it.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://global-news-2vfy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} — world news ranked by readers, not editors`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "A neutral, popularity-ranked world news hub. Spin the globe and read the top stories from any region.",
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cyan-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#07060f]"
        >
          Skip to content
        </a>
        <div className="cosmos-bg" aria-hidden />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
