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

  const confidence = totalRead === 0 ? 0 : Math.round((maxCount / totalRead) * 100);
  const topCat = interests[0]
    ? CATEGORY_META[interests[0][0] as Category]
    : null;
  const style = !hasInterests
    ? "New reader"
    : interests.length >= 4
      ? "Wide-ranging"
      : confidence >= 55
        ? "Focused"
        : "Balanced";

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <h1 className="font-display mt-6 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
          For <span className="aurora-text italic">You</span>
        </h1>
        <p className="text-sm text-slate-400">
          Recommendations built from what you actually read.
        </p>

        {totalRead === 0 ? (
          <div className="glass mt-8 rounded-3xl p-10 text-center">
            <p className="text-slate-300">
              Read a few articles and your For You feed personalizes itself.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              For now, here&apos;s what&apos;s popular across the globe.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <InsightCard
                icon="◎"
                label="AI confidence"
                value={`${confidence}%`}
                sub="How well we know your taste"
                accent="#67e8f9"
              />
              <InsightCard
                icon="📊"
                label="Top interest"
                value={topCat?.label ?? "—"}
                sub={`${confidence}% of your reading`}
                accent={topCat?.color ?? "#a78bfa"}
              />
              <InsightCard
                icon="⚡"
                label="Reading style"
                value={style}
                sub={`${totalRead} read · ${interests.length} interests`}
                accent="#f9a8d4"
              />
            </div>

            <h2 className="font-display mt-12 text-xl font-medium text-[#ece8e1]">
              Your <span className="aurora-text italic">Interest Profile</span>
            </h2>
            <div className="mt-5 flex flex-wrap justify-center gap-7 sm:justify-start">
              {interests.map(([cat, count]) => {
                const meta = CATEGORY_META[cat as Category];
                const pct = Math.round((count / totalRead) * 100);
                return (
                  <InterestRing
                    key={cat}
                    meta={meta}
                    pct={pct}
                    count={count}
                  />
                );
              })}
            </div>
          </>
        )}

        <h2 className="font-display mt-12 text-xl font-medium text-[#ece8e1]">
          {totalRead === 0 ? (
            <>
              Popular <span className="aurora-text italic">Now</span>
            </>
          ) : (
            <>
              Personalized{" "}
              <span className="aurora-text italic">Recommendations</span>
            </>
          )}
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

function InsightCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        <span style={{ color: accent }} aria-hidden>
          {icon}
        </span>{" "}
        {label}
      </div>
      <div
        className="font-display mt-2 text-2xl font-medium"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function InterestRing({
  meta,
  pct,
  count,
}: {
  meta: { label: string; emoji: string; color: string };
  pct: number;
  count: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid h-20 w-20 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${meta.color} ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        }}
      >
        <div className="font-display grid h-16 w-16 place-items-center rounded-full bg-[#0b0a16] text-lg font-medium text-white">
          {pct}%
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-200">
        {meta.emoji} {meta.label}
      </div>
      <div className="text-[11px] text-slate-500">{count} read</div>
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
      className="group glass flex flex-col overflow-hidden rounded-2xl transition hover:border-white/25 hover:bg-white/[0.05]"
    >
      <div className="relative h-36 w-full">
        <StoryImage src={story.imageUrl} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07060f]/85 to-transparent" />
        {matchPct > 0 && (
          <span
            className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-medium text-[#07060f]"
            style={{ background: "linear-gradient(90deg,#fbbf24,#f59e0b)" }}
          >
            ✦ {matchPct}% match
          </span>
        )}
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ color: cat.color, background: "rgba(7,6,15,0.6)" }}
        >
          {cat.emoji} {cat.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display line-clamp-2 font-medium text-[#ece8e1] group-hover:text-white">
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
