import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SavedList, { type SavedItem } from "@/components/SavedList";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { getAllStories } from "@/lib/news";
import { normalizeUrl } from "@/lib/url";
import { FEEDS, type Lean } from "@/lib/feeds";

export const dynamic = "force-dynamic";

export const metadata = { title: "Saved for later" };

// "Load more" grows the limit in the URL (?n=120, ?n=180, ...) rather than
// paging by offset, so removing items never makes a page skip rows.
const PAGE = 60;
const MAX = 1200;

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; lean?: string; cat?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  // lean/cat are the list's chip filters; SavedList validates them and keeps
  // them in the URL so a filtered view survives "Load more" and refreshes.
  const { n, lean, cat } = await searchParams;
  const asked = Math.floor(Number(n));
  const limit = Number.isFinite(asked)
    ? Math.min(MAX, Math.max(PAGE, Math.ceil(asked / PAGE) * PAGE))
    : PAGE;

  const sb = await getServerSupabase();
  // Ask for one extra row to learn whether there's more to load.
  // The total is a head-only count, so readers can see how many are left
  // ("Showing 60 of 140") without loading them.
  const [{ data }, { count }] = await Promise.all([
    sb
      .from("saved")
      .select("story_id,link,title,source,category,image_url,saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(limit + 1),
    sb
      .from("saved")
      .select("link", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);
  const hasMore = (data?.length ?? 0) > limit && limit < MAX;
  const rows = (data ?? []).slice(0, limit);

  // Stories rotate out of the live feed within hours; a saved item must never
  // dead-end. Link in-app while the story is live, else out to the source.
  const stories = await getAllStories();
  const live = new Map(stories.map((s) => [normalizeUrl(s.link), s]));
  // Lean: from the live story when it's still in the feed, else by matching
  // the saved outlet name against the rated roster. Anything else (web/API
  // outlets) is honestly "unrated".
  const leanByName = new Map(
    FEEDS.map((f) => [f.name.toLowerCase(), f.lean] as const),
  );

  const items: SavedItem[] = rows.map((r) => {
    const s = live.get(normalizeUrl(r.link as string));
    return {
      link: r.link as string,
      title: (r.title as string) ?? null,
      source: (r.source as string) ?? null,
      category: (r.category as string) ?? null,
      imageUrl: (r.image_url as string) ?? (s?.imageUrl ?? null),
      savedAt: r.saved_at as string,
      lean:
        s?.lean ??
        leanByName.get(((r.source as string) ?? "").toLowerCase()) ??
        ("unrated" as Lean),
      href: s ? `/article/${s.id}` : ((r.link as string) || "/"),
      external: !s,
    };
  });

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <h1 className="font-display mt-6 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
          Saved <span className="aurora-text italic">for later</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Articles you&apos;ve bookmarked to read when you&apos;re ready.
        </p>

        <SavedList
          userId={user.id}
          items={items}
          total={Math.max(count ?? 0, rows.length)}
          moreHref={hasMore ? `/saved?n=${limit + PAGE}` : null}
          initialLean={lean ?? null}
          initialCategory={cat ?? null}
        />
      </main>
    </div>
  );
}
