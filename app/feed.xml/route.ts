import { getAllStories } from "@/lib/news";
import { BRAND_NAME } from "@/lib/brand";

// RSS 2.0 feed of the top reader-ranked stories. Items link to our article
// page (which attributes and links onward to the source outlet).
export const revalidate = 600;

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://global-news-2vfy.vercel.app";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const stories = (await getAllStories()).slice(0, 30);
  const items = stories
    .map((s) => {
      const url = `${BASE}/article/${encodeURIComponent(s.id)}`;
      const pub = new Date(s.publishedAt);
      return [
        "<item>",
        `<title>${esc(s.title)}</title>`,
        `<link>${esc(url)}</link>`,
        `<guid isPermaLink="false">${esc(s.id)}</guid>`,
        Number.isNaN(pub.getTime()) ? "" : `<pubDate>${pub.toUTCString()}</pubDate>`,
        `<source url="${esc(s.link)}">${esc(s.source)}</source>`,
        `<category>${esc(s.category)}</category>`,
        s.summary ? `<description>${esc(s.summary)}</description>` : "",
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0"><channel>` +
    `<title>${esc(BRAND_NAME)} top stories</title>` +
    `<link>${esc(BASE)}</link>` +
    `<description>World news ranked by readers, not editors.</description>` +
    `<language>en</language>${items}</channel></rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
