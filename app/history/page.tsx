import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import HistoryList, { type HistoryItem } from "@/components/HistoryList";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { getAllStories } from "@/lib/news";
import { LEAN_META } from "@/lib/feeds";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reading history" };

type Row = {
  link: string;
  title: string | null;
  source: string | null;
  category: string | null;
  viewed_at: string;
};

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = await getServerSupabase();
  const { data } = await sb
    .from("reading_history")
    .select("link,title,source,category,viewed_at")
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(60);
  const rows = (data ?? []) as Row[];

  // Map reads still in the live feed back to their in-app article page (+ image).
  const stories = await getAllStories();
  const live = new Map(stories.map((s) => [s.link, s]));
  const items: HistoryItem[] = rows.map((r) => {
    const s = live.get(r.link);
    return {
      link: r.link,
      title: r.title,
      source: r.source,
      category: r.category,
      viewedAt: r.viewed_at,
      href: s ? `/article/${s.id}` : r.link || "/",
      external: !s,
      imageUrl: s?.imageUrl ?? null,
      lean: s
        ? { label: LEAN_META[s.lean].label, color: LEAN_META[s.lean].color }
        : null,
    };
  });

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Account
        </Link>

        <h1 className="font-display mt-6 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
          Reading <span className="aurora-text italic">history</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Everything you&apos;ve opened — your last {rows.length}{" "}
          {rows.length === 1 ? "story" : "stories"}.
        </p>

        <HistoryList items={items} />
      </main>
    </div>
  );
}
