import { NextResponse } from "next/server";
import { getAllStories } from "@/lib/news";

// Bounded "latest N" feed for the notification bell. Returns a small, fixed
// slice regardless of how large the corpus grows — when the feed is later
// backed by a real news API / DB, this becomes a `LIMIT 20 ORDER BY published`
// query and the client contract stays identical.
export const revalidate = 300;

export async function GET() {
  const stories = await getAllStories();
  const recent = [...stories]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, 20)
    .map((s) => ({
      id: s.id,
      title: s.title,
      source: s.source,
      lean: s.lean,
      publishedAt: s.publishedAt,
    }));
  return NextResponse.json({ stories: recent });
}
