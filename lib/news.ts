import Parser from "rss-parser";
import { FEEDS, type Feed, type Lean } from "./feeds";
import { categorize, type Category } from "./categories";
import { getPopularity } from "./engagement";

export type Story = {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceId: string;
  lean: Lean;
  category: Category;
  summary?: string;
  imageUrl?: string;
  publishedAt: string; // ISO
  lat: number;
  lng: number;
  city: string;
  country: string;
  score: number; // ranking score (cold-start blended with real popularity)
  views?: number; // real reader views (from Supabase, once configured)
  clicks?: number; // real click-throughs to the source
};

export type NewsLocation = {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  stories: Story[];
  storyCount: number;
  sources: string[];
};

type RawItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  mediaThumbnail?: { $?: { url?: string } };
  mediaContent?: Array<{ $?: { url?: string; medium?: string } }>;
};

const parser: Parser<unknown, RawItem> = new Parser({
  timeout: 8000,
  headers: {
    "user-agent":
      "Mozilla/5.0 (compatible; GlobeNewsBot/0.1; +https://globe-news.local)",
  },
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent", { keepArray: true }],
    ],
  },
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Stable, fast string hash for story ids.
function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function ageHours(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return ms / 3_600_000;
}

// Only trust http(s) URLs from untrusted feeds — blocks javascript:/data: hrefs.
function safeHttpUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const proto = new URL(url).protocol;
    return proto === "http:" || proto === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function extractImage(item: RawItem): string | undefined {
  const candidate =
    item.mediaThumbnail?.$?.url ??
    // prefer image media; skip video/audio media:content entries
    item.mediaContent?.find(
      (m) => m.$?.url && (!m.$.medium || m.$.medium === "image"),
    )?.$?.url ??
    item.enclosure?.url;
  return safeHttpUrl(candidate);
}

// Cold-start ranking. With zero users, "popularity" is approximated by recency
// (fresher = higher) plus the outlet's own editorial prominence (feed position).
// Once real view/click data exists in Supabase, we blend it in here.
function coldStartScore(ageH: number, feedIndex: number): number {
  const recency = Math.min(1, Math.max(0, 1 - ageH / 48)); // 0..1, clamps future dates
  const prominence = 1 / (feedIndex + 1); // top of feed = more prominent
  return recency * 0.7 + prominence * 0.3;
}

async function fetchFeed(feed: Feed): Promise<Story[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: 600 }, // cache parsed XML for 10 min via Next data cache
      signal: AbortSignal.timeout(6000), // never let one slow feed stall the page
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; GlobeNewsBot/0.1; +https://globe-news.local)",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = await parser.parseString(xml);
    const items = (parsed.items ?? []).slice(0, 8);

    return items
      .map((item, i): Story | null => {
        const link = safeHttpUrl(item.link);
        if (!link || !item.title) return null;

        // Defensive date parse: a single unparseable pubDate must not throw
        // (toISOString on an Invalid Date throws, which the outer catch would
        // turn into dropping this outlet's ENTIRE feed).
        const parsed = new Date(item.isoDate ?? item.pubDate ?? "");
        const publishedAt = Number.isNaN(parsed.getTime())
          ? new Date().toISOString()
          : parsed.toISOString();

        const title = item.title.trim();
        const summary = item.contentSnippet?.trim().slice(0, 220);

        return {
          id: hashId(`${feed.id}:${link}`),
          title,
          link,
          source: feed.name,
          sourceId: feed.id,
          lean: feed.lean,
          category: categorize(`${title} ${summary ?? ""}`),
          summary,
          imageUrl: extractImage(item),
          publishedAt,
          lat: feed.lat,
          lng: feed.lng,
          city: feed.city,
          country: feed.country,
          score: coldStartScore(ageHours(publishedAt), i),
        } satisfies Story;
      })
      .filter((s): s is Story => s !== null);
  } catch {
    return []; // a single dead feed never breaks the page
  }
}

// In-memory cache so repeated renders don't re-hit every feed. Next's fetch
// data cache is unreliable in dev, so this guarantees fast subsequent loads
// (and acts as a resilient layer in prod too).
const CACHE_TTL = 600_000; // 10 min
let cache: { at: number; stories: Story[] } | null = null;

export async function getAllStories(): Promise<Story[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.stories;

  const results = await Promise.all(FEEDS.map(fetchFeed));
  const seen = new Set<string>();
  const deduped: Story[] = [];
  for (const story of results.flat()) {
    if (seen.has(story.link)) continue;
    seen.add(story.link);
    deduped.push(story);
  }

  // Blend real reader popularity into the cold-start score. As views/clicks
  // accumulate, the crowd's interest takes over from recency — this is the
  // "people regulate what's popular" engine. No-op until Supabase is configured.
  const popularity = await getPopularity();
  for (const s of deduped) {
    const p = popularity.get(s.link);
    if (p && (p.views || p.clicks)) {
      s.views = p.views;
      s.clicks = p.clicks;
      const engagement = p.views + p.clicks * 3; // a click-through weighs more
      const pop = Math.min(1, Math.log10(1 + engagement) / 3); // ~0..1, saturates ~1k
      s.score = s.score * 0.5 + pop * 0.5;
    }
  }

  deduped.sort((a, b) => b.score - a.score);

  // Only refresh the cache when we actually got stories; otherwise keep the
  // last good set so a transient network blip doesn't empty the page.
  if (deduped.length > 0) cache = { at: Date.now(), stories: deduped };
  return cache?.stories ?? deduped;
}

export function groupByLocation(stories: Story[]): NewsLocation[] {
  const map = new Map<string, NewsLocation>();
  for (const s of stories) {
    const key = `${s.lat},${s.lng}`;
    let loc = map.get(key);
    if (!loc) {
      loc = {
        id: slugify(`${s.city}-${s.country}`),
        city: s.city,
        country: s.country,
        lat: s.lat,
        lng: s.lng,
        stories: [],
        storyCount: 0,
        sources: [],
      };
      map.set(key, loc);
    }
    loc.stories.push(s);
  }
  for (const loc of map.values()) {
    loc.stories.sort((a, b) => b.score - a.score);
    loc.stories = loc.stories.slice(0, 12);
    loc.storyCount = loc.stories.length;
    // build the source list from the stories actually shown, not the pre-slice set
    loc.sources = [...new Set(loc.stories.map((s) => s.source))];
  }
  return [...map.values()];
}

// Stories bucketed by category, each list already score-sorted (stories arrive
// pre-sorted from getAllStories). Used by "Explore by Category" + category pages.
export function groupByCategory(stories: Story[]): Map<Category, Story[]> {
  const map = new Map<Category, Story[]>();
  for (const s of stories) {
    const list = map.get(s.category);
    if (list) list.push(s);
    else map.set(s.category, [s]);
  }
  return map;
}

export function storiesInCategory(
  stories: Story[],
  category: Category,
): Story[] {
  return stories.filter((s) => s.category === category);
}
