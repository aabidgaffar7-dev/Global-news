import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://global-news-2vfy.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account",
        "/following",
        "/for-you",
        "/saved",
        "/history",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
