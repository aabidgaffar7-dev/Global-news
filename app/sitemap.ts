import type { MetadataRoute } from "next";
import { DISPLAY_CATEGORIES } from "@/lib/categories";
import { FEEDS } from "@/lib/feeds";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://global-news-2vfy.vercel.app";

// Public, indexable routes. Gated user pages (/account, /following, /for-you,
// /saved, /history) and the dynamic /article/[id] space are intentionally left
// out — articles rotate, and user pages are noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/popular", "/about", "/sources", "/compare", "/search"];
  const categories = [...DISPLAY_CATEGORIES, "world"].map(
    (c) => `/category/${c}`,
  );
  const outlets = FEEDS.map((f) => `/source/${f.id}`);
  return [...pages, ...categories, ...outlets].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "hourly",
    priority: path === "" ? 1 : 0.7,
  }));
}
