import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import GlobeExplorer from "@/components/GlobeExplorer";
import StoryImage from "@/components/StoryImage";
import {
  getAllStories,
  groupByLocation,
  storiesInCategory,
  type Story,
} from "@/lib/news";
import { CATEGORY_META, DISPLAY_CATEGORIES, type Category } from "@/lib/categories";
import { LEAN_META } from "@/lib/feeds";
import { formatCount, timeAgo } from "@/lib/format";

export const revalidate = 600; // rebuild from cached feeds every 10 min

export default async function Home() {
  const stories = await getAllStories();
  const locations = groupByLocation(stories);
  const popular = stories.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#03040a] text-slate-200">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        {/* Hero */}
        <section className="py-12 text-center sm:py-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            <span aria-hidden>✨ </span>
            <span className="bg-gradient-to-r from-sky-300 via-white to-indigo-300 bg-clip-text text-transparent">
              Global News Hub
            </span>
            <span aria-hidden> ✨</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
            Explore a global unbiased news network to feed your interests
          </p>
          <form
            action="/search"
            className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 focus-within:border-sky-400/40"
          >
            <span className="text-slate-500">🔍</span>
            <input
              type="text"
              name="q"
              placeholder="Search locations, news sources, articles..."
              className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
          </form>
        </section>

        {/* Interactive Earth */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <span aria-hidden>🌐</span> Interactive Earth
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Click on the glowing markers to discover regional news
          </p>
          <div className="mt-5">
            <GlobeExplorer locations={locations} />
          </div>
        </section>

        {/* Popular Now */}
        <section className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white">
            <span aria-hidden>✨ </span>Popular Now<span aria-hidden> ✨</span>
          </h2>
          <p className="mt-2 text-slate-400">
            The top 3 most-read stories across the globe
          </p>

          {popular.length === 0 ? (
            <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-8 text-slate-400">
              Stories are warming up — refresh in a moment.
            </p>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {popular.map((story, i) => (
                <PopularCard key={story.id} story={story} rank={i + 1} />
              ))}
            </div>
          )}
          <p className="mt-6 text-xs text-slate-500">
            Ranked by reader interest · updated every 10 minutes
          </p>
        </section>

        {/* Explore by Category */}
        <section className="mt-16">
          <h2 className="text-center text-3xl font-bold text-white">
            <span aria-hidden>📰 </span>Explore by Category
          </h2>
          <p className="mt-2 text-center text-slate-400">
            Discover news that matters to you
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        Global News Hub · a neutral, popularity-ranked world news hub · prototype
      </footer>
    </div>
  );
}

const RANK_BADGE = ["from-sky-500 to-blue-600", "from-violet-500 to-purple-600", "from-emerald-500 to-green-600"];

function PopularCard({ story, rank }: { story: Story; rank: number }) {
  const cat = CATEGORY_META[story.category];
  const lean = LEAN_META[story.lean];
  return (
    <Link
      href={`/article/${story.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition hover:border-sky-400/40 hover:bg-white/[0.05]"
    >
      <div className="relative h-44 w-full">
        <StoryImage src={story.imageUrl} className="h-full w-full object-cover" />
        <span
          className={`absolute left-3 top-3 rounded-full bg-gradient-to-r ${RANK_BADGE[rank - 1] ?? RANK_BADGE[0]} px-2.5 py-1 text-xs font-semibold text-white shadow`}
        >
          #{rank} Most Popular
        </span>
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ color: cat.color, background: "rgba(0,0,0,0.55)" }}
        >
          {cat.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-100 group-hover:text-white">
          {story.title}
        </h3>
        {story.summary && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-400">
            {story.summary}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 text-[11px] text-slate-500">
          <span className="font-medium text-slate-400">{story.source}</span>
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{ color: lean.color, background: `${lean.color}1a` }}
          >
            {lean.label}
          </span>
          <span>· 📍 {story.city}</span>
          {story.views ? <span>· 👁 {formatCount(story.views)}</span> : null}
          <span className="ml-auto text-sky-400 group-hover:text-sky-300">
            Read More →
          </span>
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
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
          style={{ background: `${meta.color}22` }}
        >
          {meta.emoji}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{meta.label}</h3>
          <p className="text-xs text-slate-400">{meta.description}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {count} {count === 1 ? "article" : "articles"} available
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
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: meta.color }} />
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
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-sky-300"
      >
        View All {meta.label} News →
      </Link>
    </div>
  );
}
