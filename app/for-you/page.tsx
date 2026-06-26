import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import StoryImage from "@/components/StoryImage";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { getAllStories, type Story } from "@/lib/news";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ForYouPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = await getServerSupabase();
  const { data: historyRows } = await sb
    .from("reading_history")
    .select("link,category")
    .eq("user_id", user.id);
  const history = historyRows ?? [];

  const readLinks = new Set(history.map((h) => h.link));
  const counts = new Map<string, number>();
  for (const h of history) {
    if (h.category) counts.set(h.category, (counts.get(h.category) ?? 0) + 1);
  }
  const interests = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = interests[0]?.[1] ?? 0;
  const totalRead = history.length;

  const stories = await getAllStories();

  // Recommend unread stories in the user's interest categories (or globally
  // popular as a cold-start, before any reading history exists).
  const hasInterests = interests.length > 0;
  const recommendations: Story[] = stories
    .filter((s) => !readLinks.has(s.link))
    .filter((s) => (hasInterests ? counts.has(s.category) : true))
    .sort((a, b) => {
      const ca = counts.get(a.category) ?? 0;
      const cb = counts.get(b.category) ?? 0;
      return cb - ca || b.score - a.score;
    })
    .slice(0, 9);

  return (
    <div className="min-h-screen bg-[#03040a] text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-white">
          <span aria-hidden>✦ </span>For You
        </h1>
        <p className="text-sm text-slate-400">
          Recommendations built from what you actually read.
        </p>

        {totalRead === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-slate-300">
              Read a few articles and your For You feed personalizes itself.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              For now, here&apos;s what&apos;s popular across the globe.
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatCard label="Articles read" value={`${totalRead}`} icon="👁" />
              <StatCard
                label="Top interest"
                value={
                  interests[0]
                    ? CATEGORY_META[interests[0][0] as Category].label
                    : "—"
                }
                icon="📊"
              />
              <StatCard
                label="Interests"
                value={`${interests.length}`}
                icon="🌐"
              />
            </div>

            {/* Interest profile */}
            <h2 className="mt-10 text-xl font-semibold text-white">
              Your Interest Profile
            </h2>
            <div className="mt-3 space-y-2">
              {interests.map(([cat, count]) => {
                const meta = CATEGORY_META[cat as Category];
                const pct = Math.round((count / totalRead) * 100);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-slate-300">
                      {meta.emoji} {meta.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-slate-500">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Recommendations */}
        <h2 className="mt-10 text-xl font-semibold text-white">
          <span aria-hidden>✦ </span>
          {totalRead === 0 ? "Popular Now" : "Personalized Recommendations"}
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((story) => (
            <RecCard
              key={story.id}
              story={story}
              matchPct={
                maxCount > 0
                  ? Math.round(((counts.get(story.category) ?? 0) / maxCount) * 100)
                  : 0
              }
              readCount={counts.get(story.category) ?? 0}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-sm text-slate-400">
        <span aria-hidden>{icon}</span> {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function RecCard({
  story,
  matchPct,
  readCount,
}: {
  story: Story;
  matchPct: number;
  readCount: number;
}) {
  const cat = CATEGORY_META[story.category];
  return (
    <Link
      href={`/article/${story.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-sky-400/40 hover:bg-white/[0.05]"
    >
      <div className="relative h-36 w-full">
        <StoryImage src={story.imageUrl} className="h-full w-full object-cover" />
        {matchPct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[11px] font-semibold text-black">
            ✦ {matchPct}% match
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-100 group-hover:text-white">
          {story.title}
        </h3>
        <div className="mt-2 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] p-2 text-[11px] text-amber-200/80">
          <span className="font-medium">Why:</span>{" "}
          {readCount > 0
            ? `interest in ${cat.label} (${readCount} read)`
            : "trending globally"}
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          {story.source} · 📍 {story.city} · {timeAgo(story.publishedAt)}
        </div>
      </div>
    </Link>
  );
}
