import { categorize } from "./categories";
import type { Story } from "./news";

// Server-side only secret (NOT NEXT_PUBLIC) — never exposed to the browser.
const KEY = process.env.GNEWS_API_KEY;
export const gnewsEnabled = Boolean(KEY);

type GNewsArticle = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
  source?: { name?: string };
};

// Web articles have no stable server-side store, so we pack what the article
// page needs to summarize them into the id itself (base64url). The article page
// decodes this; see decodeWebStory in lib/article.ts.
function encodeWebId(p: Record<string, unknown>): string {
  return "web_" + Buffer.from(JSON.stringify(p)).toString("base64url");
}

const cache = new Map<string, { at: number; stories: Story[] }>();
const TTL = 300_000; // 5 min — respects the free-tier request budget

export async function searchWeb(query: string): Promise<Story[]> {
  const q = query.trim();
  if (!KEY || !q) return [];

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.stories;

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&apikey=${KEY}`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { articles?: GNewsArticle[] };

    const stories: Story[] = (data.articles ?? [])
      .filter((a) => a.url && a.title)
      .map((a) => {
        const title = a.title!.trim();
        const summary = a.description?.trim().slice(0, 220);
        const category = categorize(`${title} ${summary ?? ""}`);
        const publishedAt = a.publishedAt ?? new Date().toISOString();
        const image =
          a.image && /^https?:\/\//.test(a.image) ? a.image : undefined;
        const source = a.source?.name ?? "Web";
        const id = encodeWebId({
          u: a.url,
          t: title,
          s: source,
          c: category,
          d: summary,
          i: image,
          p: publishedAt,
        });
        return {
          id,
          title,
          link: a.url!,
          source,
          sourceId: "gnews",
          lean: "intl",
          category,
          summary,
          imageUrl: image,
          publishedAt,
          lat: 0,
          lng: 0,
          city: "",
          country: "",
          score: 0,
        } satisfies Story;
      });

    cache.set(key, { at: Date.now(), stories });
    return stories;
  } catch {
    return []; // never let the web source break search
  }
}
