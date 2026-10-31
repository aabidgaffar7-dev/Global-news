import type { Story } from "@/lib/news";
import { BRAND_NAME } from "@/lib/brand";

export const SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://global-news-2vfy.vercel.app";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Builds an RSS 2.0 document. Items link to our article page (which attributes
// and links onward to the source outlet).
export function buildRss(opts: {
  title: string;
  link: string;
  description: string;
  stories: Story[];
}): Response {
  const items = opts.stories
    .map((s) => {
      const url = `${SITE_BASE}/article/${encodeURIComponent(s.id)}`;
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
    `<title>${esc(opts.title)}</title>` +
    `<link>${esc(opts.link)}</link>` +
    `<description>${esc(opts.description)}</description>` +
    `<language>en</language>${items}</channel></rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

export { BRAND_NAME };
