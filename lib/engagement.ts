import { getSupabase } from "./supabase";
import { normalizeUrl } from "./url";

export type EngagementKind = "view" | "click";
export type Popularity = { views: number; clicks: number };

// Record a reader signal. "view" = opened the in-app summary; "click" = clicked
// through to the source (the stronger "this mattered to me" signal). No-op when
// Supabase isn't configured, so the app works fully without it.
export async function recordEngagement(
  link: string,
  title: string,
  source: string,
  kind: EngagementKind,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.rpc("increment_engagement", {
      p_link: normalizeUrl(link), // tracking params must not split counts
      p_title: title,
      p_source: source,
      p_kind: kind,
    });
  } catch {
    // engagement tracking must never break the page
  }
}

// Engagement counts keyed by NORMALIZED article link, for blending into the
// ranking. Bounded to the recent window: links older than the live feed can
// never match a live story, and an unbounded select would silently truncate
// at Supabase's row cap once the corpus grows.
export async function getPopularity(): Promise<Map<string, Popularity>> {
  const map = new Map<string, Popularity>();
  const sb = getSupabase();
  if (!sb) return map;
  try {
    const since = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
    const { data } = await sb
      .from("story_engagement")
      .select("link,views,clicks")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(5000);
    for (const row of data ?? []) {
      map.set(normalizeUrl(row.link as string), {
        views: (row.views as number) ?? 0,
        clicks: (row.clicks as number) ?? 0,
      });
    }
  } catch {
    // fall back to an empty map → pure cold-start ranking
  }
  return map;
}
