import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import TrendingTicker from "@/components/TrendingTicker";
import GlobeExplorer from "@/components/GlobeExplorer";
import StoryImage from "@/components/StoryImage";
import {
  getAllStories,
  groupByLocation,
  storiesInCategory,
  type Story,
} from "@/lib/news";
import {
  CATEGORY_META,
  DISPLAY_CATEGORIES,
  type Category,
} from "@/lib/categories";
import { LEAN_META } from "@/lib/feeds";
import { formatCount, timeAgo } from "@/lib/format";

export const revalidate = 600;

export default async function Home() {
  const stories = await getAllStories();
  const locations = groupByLocation(stories);
  const popular = stories.slice(0, 6);

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <TrendingTicker stories={stories.slice(0, 14)} />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        {/* Hero */}
        <section className="py-9 text-center sm:py-12">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
            A neutral, popularity-ranked world news hub
          </div>
          <h1 className="font-display mx-auto mt-4 max-w-3xl text-balance text-4xl font-medium leading-[1.1] text-[#ece8e1] sm:text-6xl">
            The world&apos;s news,{" "}
            <span className="aurora-text italic">ranked by people</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-slate-400 sm:text-lg">
            Spin the globe, drop into any place, and read what people actually
            care about — not what an algorithm wants you to see.
          </p>
          <form
            action="/search"
            className="mx-auto mt-9 flex max-w-2xl items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.03] px-5 py-3.5 backdrop-blur transition focus-within:border-cyan-400/40"
          >
            <span className="text-slate-500" aria-hidden>
              🔍
            </span>
            <input
              type="text"
              name="q"
              placeholder="Search locations, sources, or the wider web…"
              className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
          </form>
        </section>

        {/* Interactive Earth */}
        <section id="globe" className="glass scroll-mt-20 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden>
              🌐
            </span>
            <h2 className="font-display text-2xl font-medium text-[#ece8e1]">
              Interactive Earth
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Spin the globe and drop into any region&apos;s top stories.
          </p>
          <div className="mt-5">
            <GlobeExplorer locations={locations} />
          </div>
        </section>

        {/* Popular Now */}
        <section className="mt-20 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
            Trending across the globe
          </div>
          <h2 className="font-display mt-3 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
            Popular <span className="aurora-text italic">Now</span>
          </h2>
          <p className="mt-2 text-slate-400">
            The stories people are reading most — ranked by readers, not
            algorithms.
          </p>

          {popular.length === 0 ? (
            <p className="glass mt-8 rounded-2xl p-8 text-slate-400">
              Stories are warming up — refresh in a moment.
            </p>
          ) : (
            <>
              <div className="mt-9 grid gap-5 md:grid-cols-3">
                {popular.map((story, i) => (
                  <PopularCard key={story.id} story={story} rank={i + 1} />
                ))}
              </div>
              <Link
                href="/popular"
                className="mt-9 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.04]"
              >
                View the full leaderboard{" "}
                <span className="aurora-text">→</span>
              </Link>
            </>
          )}
        </section>

        {/* Explore by Category */}
        <section className="mt-20">
          <h2 className="font-display text-center text-3xl font-medium text-[#ece8e1] sm:text-4xl">
            Explore by <span className="aurora-text italic">Category</span>
          </h2>
          <p className="mt-2 text-center text-slate-400">
            Discover the news that matters to you.
          </p>

          <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DISPLAY_CATEGORIES.map((category) => {
              const inCat = storiesInCategory(stories, category);
              return (
                <CategoryCard
                  key={category}
                  category={category}
                  preview={inCat.slice(0, 2)}
                  count={inCat.length}
                />
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

const RANK_BADGE = [
  "from-cyan-400 to-violet-500",
  "from-violet-400 to-pink-500",
  "from-emerald-400 to-teal-500",
];

function PopularCard({ story, rank }: { story: Story; rank: number }) {
  const cat = CATEGORY_META[story.category];
  const lean = LEAN_META[story.lean];
  return (
    <Link
      href={`/article/${story.id}`}
      className="group glass flex flex-col overflow-hidden rounded-2xl text-left transition hover:border-white/25 hover:bg-white/[0.05]"
    >
      <div className="relative h-44 w-full">
        <StoryImage src={story.imageUrl} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07060f]/85 via-transparent to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full bg-gradient-to-r ${RANK_BADGE[rank - 1] ?? RANK_BADGE[0]} px-2.5 py-1 text-xs font-medium text-[#07060f]`}
        >
          #{rank} Most Popular
        </span>
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ color: cat.color, background: "rgba(7,6,15,0.6)" }}
        >
          {cat.emoji} {cat.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display line-clamp-2 text-lg font-medium text-[#ece8e1] group-hover:text-white">
          {story.title}
        </h3>
        {story.summary && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-400">
            {story.summary}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 text-[11px] text-slate-500">
          <span className="font-medium text-slate-300">{story.source}</span>
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{ color: lean.color, background: `${lean.color}1a` }}
          >
            {lean.label}
          </span>
          <span>· 📍 {story.city}</span>
          {story.views ? <span>· 👁 {formatCount(story.views)}</span> : null}
          <span className="aurora-text ml-auto font-medium">Read →</span>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({
  category,
  preview,
  count,
}: {
  category: Category;
  preview: Story[];
  count: number;
}) {
  const meta = CATEGORY_META[category];
  return (
    <div className="glass flex flex-col rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
          style={{
            background: `${meta.color}1f`,
            boxShadow: `0 0 20px ${meta.color}22`,
          }}
        >
          {meta.emoji}
        </span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium text-[#ece8e1]">
            {meta.label}
          </h3>
          <p className="text-xs text-slate-400">{meta.description}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {count} {count === 1 ? "article" : "articles"}
      </p>

      <ul className="mt-3 flex-1 space-y-2">
        {preview.length === 0 && (
          <li className="text-xs text-slate-600">No stories right now.</li>
        )}
        {preview.map((story) => (
          <li key={story.id}>
            <Link
              href={`/article/${story.id}`}
              className="group flex items-start gap-2 rounded-lg p-1.5 transition hover:bg-white/5"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ background: meta.color }}
              />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm text-slate-200 group-hover:text-white">
                  {story.title}
                </span>
                <span className="text-[11px] text-slate-500">
                  {story.source} · {timeAgo(story.publishedAt)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/category/${category}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium transition hover:gap-2"
        style={{ color: meta.color }}
      >
        View all {meta.label} →
      </Link>
    </div>
  );
}
