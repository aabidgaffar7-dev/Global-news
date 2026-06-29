import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import StoryImage from "@/components/StoryImage";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { getAllStories } from "@/lib/news";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { LEAN_META } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

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

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-8">
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

        {rows.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-10 text-center text-slate-400">
            Nothing here yet — articles you read will show up here.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => {
              const s = live.get(r.link);
              const cat = r.category
                ? CATEGORY_META[r.category as Category]
                : null;
              const external = !s;
              return (
                <li key={r.link}>
                  <Link
                    href={s ? `/article/${s.id}` : r.link || "/"}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="group glass flex items-center gap-4 rounded-2xl p-3 transition hover:-translate-y-0.5 hover:border-white/25"
                  >
                    <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
                      <StoryImage
                        src={s?.imageUrl}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display line-clamp-2 font-medium text-[#ece8e1] group-hover:text-white">
                        {r.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        {cat && (
                          <span
                            className="rounded-full px-1.5 py-0.5 font-medium"
                            style={{
                              color: cat.color,
                              background: `${cat.color}1a`,
                            }}
                          >
                            {cat.emoji} {cat.label}
                          </span>
                        )}
                        <span className="font-medium text-slate-300">
                          {r.source}
                        </span>
                        {s && (
                          <span style={{ color: LEAN_META[s.lean].color }}>
                            · {LEAN_META[s.lean].label}
                          </span>
                        )}
                        <span>· read {timeAgo(r.viewed_at)}</span>
                        {external && (
                          <span className="text-slate-600">· source ↗</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
