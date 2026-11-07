import { NextResponse } from "next/server";
import { getAllStories } from "@/lib/news";
import { FEEDS } from "@/lib/feeds";

// Per-outlet story counts for monitoring: point an uptime checker at this and
// alert when `silent` is non-empty. Cached for 10 minutes like the pages.
export const revalidate = 600;

export async function GET() {
  const stories = await getAllStories();
  const byOutlet = new Map<string, { count: number; latest: number }>();
  for (const s of stories) {
    const t = Date.parse(s.publishedAt);
    const cur = byOutlet.get(s.sourceId) ?? { count: 0, latest: 0 };
    cur.count++;
    if (!Number.isNaN(t) && t > cur.latest) cur.latest = t;
    byOutlet.set(s.sourceId, cur);
  }
  const outlets = FEEDS.map((f) => {
    const o = byOutlet.get(f.id);
    return {
      id: f.id,
      name: f.name,
      stories: o?.count ?? 0,
      latest: o?.latest ? new Date(o.latest).toISOString() : null,
    };
  });
  return NextResponse.json({
    totalStories: stories.length,
    outlets,
    silent: outlets.filter((o) => o.stories === 0).map((o) => o.id),
  });
}
