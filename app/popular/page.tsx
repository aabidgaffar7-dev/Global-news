import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import StoryImage from "@/components/StoryImage";
import { getAllStories, type Story } from "@/lib/news";
import {
  CATEGORY_META,
  DISPLAY_CATEGORIES,
  type Category,
} from "@/lib/categories";
import { LEAN_META } from "@/lib/feeds";
import { formatCount, timeAgo } from "@/lib/format";

export const revalidate = 600;

const WINDOWS = [
  { key: "all", label: "All time", hours: Infinity },
  { key: "week", label: "This week", hours: 24 * 7 },
  { key: "today", label: "Today", hours: 24 },
] as const;

export default async function PopularPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; when?: string }>;
}) {
  const { cat, when } = await searchParams;
  const activeCat = (DISPLAY_CATEGORIES as string[]).includes(cat ?? "")
    ? (cat as Category)
    : null;
  const win = WINDOWS.find((w) => w.key === when) ?? WINDOWS[0];

  const all = await getAllStories();
  const now = Date.now();
  const filtered = all
    .filter((s) => (activeCat ? s.category === activeCat : true))
    .filter(
      (s) =>
        win.hours === Infinity ||
        (now - new Date(s.publishedAt).getTime()) / 3_600_000 <= win.hours,
    )
    .slice(0, 40);

  // Build a URL keeping the other filter intact.
  const qp = (next: { cat?: string | null; when?: string }) => {
    const c = next.cat !== undefined ? next.cat : activeCat;
    const w = next.when !== undefined ? next.when : win.key;
    const params = new URLSearchParams();
    if (c) params.set("cat", c);
    if (w && w !== "all") params.set("when", w);
    const qs = params.toString();
    return `/popular${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <header className="mt-6">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
            Trending across the globe
          </div>
          <h1 className="font-display mt-2 text-4xl font-medium text-[#ece8e1] sm:text-5xl">
            Most <span className="aurora-text italic">Popular</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Ranked by what readers actually open — the crowd decides, not an
            algorithm.
          </p>
        </header>

        {/* Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <FilterPill href={qp({ cat: null })} active={!activeCat}>
              All topics
            </FilterPill>
            {DISPLAY_CATEGORIES.map((c) => (
              <FilterPill
                key={c}
                href={qp({ cat: c })}
                active={activeCat === c}
                color={CATEGORY_META[c].color}
              >
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </FilterPill>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <FilterPill
                key={w.key}
                href={qp({ when: w.key })}
                active={win.key === w.key}
              >
                {w.label}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        {filtered.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-8 text-center text-slate-400">
            No stories match this filter right now — try a wider window.
          </p>
        ) : (
          <ol className="mt-7 space-y-3">
            {filtered.map((story, i) => (
              <RankRow key={story.id} story={story} rank={i + 1} />
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}

function FilterPill({
  href,
  active,
  color,
  children,
}: {
  href: string;
  active: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-transparent bg-white/10 text-white"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
      }`}
      style={
        active && color
          ? { boxShadow: `inset 0 0 0 1px ${color}66`, color }
          : undefined
      }
    >
      {children}
    </Link>
  );
}

const RANK_BADGE = [
  "from-cyan-400 to-violet-500",
  "from-violet-400 to-pink-500",
  "from-emerald-400 to-teal-500",
];

function RankRow({ story, rank }: { story: Story; rank: number }) {
  const cat = CATEGORY_META[story.category];
  const lean = LEAN_META[story.lean];
  return (
    <li>
      <Link
        href={`/article/${story.id}`}
        className="group glass flex items-center gap-4 rounded-2xl p-3 transition hover:-translate-y-0.5 hover:border-white/25"
      >
        <div className="flex w-8 shrink-0 justify-center">
          {rank <= 3 ? (
            <span
              className={`font-display flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${RANK_BADGE[rank - 1]} text-sm font-semibold text-[#07060f]`}
            >
              {rank}
            </span>
          ) : (
            <span className="font-display text-lg font-medium tabular-nums text-slate-500">
              {rank}
            </span>
          )}
        </div>

        <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
          <StoryImage src={story.imageUrl} className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display line-clamp-1 font-medium text-[#ece8e1] group-hover:text-white sm:line-clamp-2">
            {story.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span
              className="rounded-full px-1.5 py-0.5 font-medium"
              style={{ color: cat.color, background: `${cat.color}1a` }}
            >
              {cat.emoji} {cat.label}
            </span>
            <span className="font-medium text-slate-300">{story.source}</span>
            <span style={{ color: lean.color }}>· {lean.label}</span>
            <span>· 📍 {story.city}</span>
            <span>· {timeAgo(story.publishedAt)}</span>
          </div>
        </div>

        {story.views ? (
          <div className="shrink-0 text-right">
            <div className="font-display text-sm font-medium tabular-nums text-cyan-300">
              {formatCount(story.views)}
            </div>
            <div className="text-[10px] text-slate-500">views</div>
          </div>
        ) : null}
      </Link>
    </li>
  );
}
