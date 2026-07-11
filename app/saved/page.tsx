import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SavedList, { type SavedItem } from "@/components/SavedList";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { getAllStories } from "@/lib/news";
import { normalizeUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export const metadata = { title: "Saved for later" };

export default async function SavedPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = await getServerSupabase();
  // Bounded query — paginate with a "load more" once readers save a lot.
  const { data } = await sb
    .from("saved")
    .select("story_id,link,title,source,category,image_url,saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(60);
  const rows = data ?? [];

  // Stories rotate out of the live feed within hours; a saved item must never
  // dead-end. Link in-app while the story is live, else out to the source.
  const stories = await getAllStories();
  const live = new Map(stories.map((s) => [normalizeUrl(s.link), s]));

  const items: SavedItem[] = rows.map((r) => {
    const s = live.get(normalizeUrl(r.link as string));
    return {
      link: r.link as string,
      title: (r.title as string) ?? null,
      source: (r.source as string) ?? null,
      category: (r.category as string) ?? null,
      imageUrl: (r.image_url as string) ?? (s?.imageUrl ?? null),
      savedAt: r.saved_at as string,
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

        <SavedList userId={user.id} items={items} />
      </main>
    </div>
  );
}
