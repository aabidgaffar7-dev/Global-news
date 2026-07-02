// Persistent story store (Supabase `stories` table): every story the app has
// ever seen keeps working at /article/[id] after it rotates out of the live
// feed. Everything here is best-effort and resilient — the app runs fully
// without the table (saved/shared old links just fall back to the source).
import { getSupabase } from "./supabase";
import { CATEGORY_META, type Category } from "./categories";
import { LEAN_META, type Lean } from "./feeds";
import { normalizeUrl, safeHttpUrl } from "./url";
import type { Placement, Story } from "./news";

export async function persistStories(stories: Story[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const rows = stories.slice(0, 250).map((s) => ({
      id: s.id,
      link: normalizeUrl(s.link),
      title: s.title,
      source: s.source,
      source_id: s.sourceId,
      lean: s.lean,
      category: s.category,
      summary: s.summary ?? null,
      image_url: s.imageUrl ?? null,
      published_at: s.publishedAt,
      lat: s.lat,
      lng: s.lng,
      city: s.city,
      country: s.country,
      placement: s.placement,
    }));
    await sb.from("stories").upsert(rows, { onConflict: "id" });
  } catch {
    // table may not exist yet — never break the feed over persistence
  }
}

export async function getStoredStory(id: string): Promise<Story | undefined> {
  const sb = getSupabase();
  if (!sb || !id || id.length > 64) return undefined;
  try {
    const { data } = await sb
      .from("stories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) return undefined;
    const link = safeHttpUrl(data.link as string);
    const title = typeof data.title === "string" ? data.title.slice(0, 300) : "";
    if (!link || !title) return undefined;
    const lean: Lean =
      typeof data.lean === "string" && data.lean in LEAN_META
        ? (data.lean as Lean)
        : "unrated";
    const category: Category =
      typeof data.category === "string" && data.category in CATEGORY_META
        ? (data.category as Category)
        : "world";
    const placement: Placement =
      data.placement === "city" || data.placement === "country"
        ? data.placement
        : "source";
    return {
      id,
      title,
      link,
      source:
        typeof data.source === "string" ? data.source.slice(0, 120) : "Web",
      sourceId: typeof data.source_id === "string" ? data.source_id : "stored",
      lean,
      category,
      summary:
        typeof data.summary === "string" ? data.summary.slice(0, 300) : undefined,
      imageUrl: safeHttpUrl(data.image_url as string | null),
      publishedAt:
        typeof data.published_at === "string"
          ? data.published_at
          : new Date().toISOString(),
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      city: typeof data.city === "string" ? data.city : "",
      country: typeof data.country === "string" ? data.country : "",
      placement,
      baseScore: 0,
      score: 0,
    };
  } catch {
    return undefined;
  }
}
