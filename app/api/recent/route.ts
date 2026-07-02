import { NextResponse } from "next/server";
import { getAllStories } from "@/lib/news";
import { getUser, getServerSupabase } from "@/lib/supabase-server";

// Bounded "latest N" feed for the notification bell and the signed-in home
// wire. Signed-in readers get follow-matched stories FIRST (with the reason),
// then global latest as fill — so the bell is personal, not a generic ticker.
// Returns a small fixed slice regardless of corpus size.
export const dynamic = "force-dynamic";

type Item = {
  id: string;
  title: string;
  source: string;
  lean: string;
  publishedAt: string;
  match?: string; // why this is for YOU ("BBC News", "#climate", "Technology"…)
};

export async function GET() {
  const stories = await getAllStories();
  const newest = [...stories].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const toItem = (s: (typeof stories)[number], match?: string): Item => ({
    id: s.id,
    title: s.title,
    source: s.source,
    lean: s.lean,
    publishedAt: s.publishedAt,
    match,
  });

  // Personalization is best-effort: any failure degrades to the global feed.
  try {
    const user = await getUser();
    if (user) {
      const sb = await getServerSupabase();
      const { data: follows } = await sb
        .from("follows")
        .select("kind,value")
        .eq("user_id", user.id);
      if (follows && follows.length > 0) {
        const srcs = new Set(
          follows.filter((f) => f.kind === "source").map((f) => f.value),
        );
        const cats = new Set(
          follows.filter((f) => f.kind === "category").map((f) => f.value),
        );
        const locs = new Set(
          follows.filter((f) => f.kind === "location").map((f) => f.value),
        );
        const escapeRe = (s: string) =>
          s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const kws = follows
          .filter((f) => f.kind === "keyword")
          .map((f) => ({
            k: f.value,
            re: new RegExp(`\\b${escapeRe(f.value)}\\b`, "i"),
          }));

        const matchOf = (s: (typeof stories)[number]): string | null => {
          if (srcs.has(s.sourceId)) return s.source;
          const hay = `${s.title} ${s.summary ?? ""}`;
          const kw = kws.find((x) => x.re.test(hay));
          if (kw) return `#${kw.k}`;
          if (cats.has(s.category))
            return s.category.charAt(0).toUpperCase() + s.category.slice(1);
          if (s.placement === "city" && locs.has(s.city)) return s.city;
          return null;
        };

        const matched: Item[] = [];
        const rest: Item[] = [];
        for (const s of newest) {
          const m = matchOf(s);
          if (m && matched.length < 12) matched.push(toItem(s, m));
          else if (rest.length < 20) rest.push(toItem(s));
          if (matched.length >= 12 && rest.length >= 20) break;
        }
        return NextResponse.json({
          stories: [...matched, ...rest].slice(0, 20),
          personalized: matched.length > 0,
        });
      }
    }
  } catch {
    // fall through to the global feed
  }

  return NextResponse.json({
    stories: newest.slice(0, 20).map((s) => toItem(s)),
    personalized: false,
  });
}
