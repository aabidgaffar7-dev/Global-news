// Broad news coverage via NewsData.io — thousands of outlets incl. US
// local/regional news, layered on top of the curated lean-rated roster.
// Scale-aware by design: a fixed 3 requests per refresh (10 articles each),
// cached 30 minutes → ~144 of the free tier's 200 daily credits. No-op
// without NEWSDATA_API_KEY.
import { categorize, type Category } from "./categories";
import { geolocate, cityForCountry } from "./cities";
import { safeHttpUrl, truncate, stablePublishedAt } from "./url";
import type { Story } from "./news";

type NewsDataArticle = {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  image_url?: string;
  source_name?: string;
  source_id?: string;
  country?: string[];
  category?: string[];
};

const API = "https://newsdata.io/api/1/latest";

// One request per query per refresh; each returns up to 10 articles.
const QUERIES = [
  "language=en&removeduplicate=1", // global top
  "language=en&country=us&removeduplicate=1", // US incl. local/regional
  "language=en&category=business,technology,sports,entertainment,health&removeduplicate=1", // topical breadth
];

// NewsData's taxonomy → ours ("top"/"other"/etc. fall through to categorize()).
const CATEGORY_MAP: Record<string, Category> = {
  politics: "politics",
  business: "business",
  technology: "technology",
  science: "technology",
  entertainment: "entertainment",
  lifestyle: "entertainment",
  tourism: "entertainment",
  food: "entertainment",
  health: "health",
  sports: "sports",
  world: "world",
};

function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function toCategory(
  cats: string[] | undefined,
  title: string,
  summary?: string,
): Category {
  for (const c of cats ?? []) {
    const mapped = CATEGORY_MAP[c.toLowerCase()];
    if (mapped) return mapped;
  }
  return categorize(title, summary);
}

function score(publishedAt: string, index: number): number {
  const ageH = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  const recency = Math.min(1, Math.max(0, 1 - ageH / 48));
  return recency * 0.7 + (1 / (index + 1)) * 0.3;
}

function toStory(a: NewsDataArticle, index: number): Story | null {
  const link = safeHttpUrl(a.link);
  const title = a.title?.trim();
  if (!link || !title) return null;

  const summary = truncate(a.description);
  const text = `${title} ${summary ?? ""}`;

  // Place the story: the city its text names, else its country's hub city.
  // Provenance is recorded so surfaces never claim a hub city as the story's
  // actual location when we only know the country.
  const cityHit = geolocate(text);
  const place = cityHit ?? cityForCountry(a.country?.[0] ?? "");
  if (!place) return null; // can't put it on the globe — skip (bounded loss)

  const publishedAt = stablePublishedAt(a.pubDate, link);
  const base = score(publishedAt, index);

  return {
    id: hashId(`nd:${link}`),
    title,
    link,
    source: a.source_name?.trim() || a.source_id || "Web",
    sourceId: "newsdata",
    lean: "unrated", // honest: these outlets aren't editorially rated
    category: toCategory(a.category, title, summary),
    summary,
    imageUrl: safeHttpUrl(a.image_url),
    publishedAt,
    lat: place.lat,
    lng: place.lng,
    city: place.name,
    country: place.country,
    placement: cityHit ? "city" : "country",
    baseScore: base,
    score: base,
  };
}

export const newsdataEnabled = !!process.env.NEWSDATA_API_KEY;

// Module cache guards dev (where Next's data cache is unreliable) from
// burning API credits on every render.
const CACHE_TTL = 1_800_000; // 30 min
let cache: { at: number; stories: Story[] } | null = null;

export async function fetchBroadNews(): Promise<Story[]> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return [];
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.stories;

  const seen = new Set<string>();
  const stories: Story[] = [];

  // Sequential on purpose — stays far under NewsData's burst limits.
  for (const q of QUERIES) {
    try {
      const res = await fetch(`${API}?apikey=${key}&${q}`, {
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as { results?: NewsDataArticle[] };
      for (const [i, a] of (body.results ?? []).entries()) {
        const s = toStory(a, i);
        if (!s || seen.has(s.link)) continue;
        seen.add(s.link);
        stories.push(s);
      }
    } catch {
      // one failed query never blocks the rest
    }
  }

  if (stories.length > 0) cache = { at: Date.now(), stories };
  return cache?.stories ?? stories;
}
