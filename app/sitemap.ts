import type { MetadataRoute } from "next";
import { DISPLAY_CATEGORIES } from "@/lib/categories";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://global-news-2vfy.vercel.app";

// Public, indexable routes. Gated user pages (/account, /following, /for-you,
// /saved, /history) and the dynamic /article/[id] space are intentionally left
// out — articles rotate, and user pages are noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/popular", "/about", "/search"];
  const categories = [...DISPLAY_CATEGORIES, "world"].map(
    (c) => `/category/${c}`,
  );
  return [...pages, ...categories].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "hourly",
    priority: path === "" ? 1 : 0.7,
  }));
}
