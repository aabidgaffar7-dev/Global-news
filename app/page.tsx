import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import TrendingTicker from "@/components/TrendingTicker";
import TrendingLeanBar from "@/components/TrendingLeanBar";
import OnboardingStrip from "@/components/OnboardingStrip";
import YourWireStrip from "@/components/YourWireStrip";
import FrontPage from "@/components/FrontPage";
import HowStoriesRise from "@/components/HowStoriesRise";
import Icon, { CATEGORY_ICON } from "@/components/Icon";
import {
  getAllStories,
  globeLocations,
  storiesInCategory,
  type Story,
} from "@/lib/news";
import {
  CATEGORY_META,
  DISPLAY_CATEGORIES,
  type Category,
} from "@/lib/categories";
import { REGIONS, regionOf } from "@/lib/regions";
import { clusterCoverage } from "@/lib/compare";
import { LEAN_META } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

export const revalidate = 600;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;
  const activeRegion = REGIONS.find((r) => r === region) ?? null;
  const stories = await getAllStories();
  const regionStories = activeRegion
    ? stories.filter((s) => regionOf(s.country) === activeRegion)
    : stories;
  const clusters = clusterCoverage(stories, { limit: 3 });
  const active = globeLocations(stories).filter((l) => l.storyCount > 0);
  const activeCities = active.length;
  const countries = new Set(active.map((l) => l.country)).size;
  const outlets = new Set(stories.map((s) => s.source)).size;
  const dateline = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <TrendingTicker stories={stories.slice(0, 14)} />

      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-24">
        {/* Masthead — a dateline and live counts, not a landing-page pitch.
            The reader should know within one second that this is a news site
            showing today's world. */}
        <section className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-white/10 py-6 sm:py-8">
          <div>
            <h1 className="font-display text-balance text-3xl font-medium leading-[1.1] text-[#ece8e1] sm:text-[2.6rem]">
              The world&apos;s news,{" "}
              <span className="aurora-text italic">ranked by people</span>
            </h1>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
              {dateline} · {stories.length} stories · {outlets} outlets · updated
              continuously
            </p>
          </div>
          <form
            action="/search"
            className="flex w-full items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-2.5 backdrop-blur transition focus-within:border-cyan-400/40 sm:w-80"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              className="shrink-0 text-slate-500"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              name="q"
              placeholder="Search the world's news…"
              aria-label="Search"
              className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
          </form>
        </section>

        {/* THE NEWS — first interactive content on the page. */}
        <nav
          aria-label="Filter by region"
          className="mt-6 flex flex-wrap gap-2"
        >
          {[null, ...REGIONS].map((r) => (
            <Link
              key={r ?? "all"}
              href={r ? `/?region=${encodeURIComponent(r)}` : "/"}
              aria-current={activeRegion === r ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                activeRegion === r
                  ? "border-transparent bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
              }`}
            >
              {r ? `🌍 ${r}` : "All regions"}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          {regionStories.length === 0 ? (
            <p className="glass rounded-2xl p-6 text-sm text-slate-400">
              No stories from {activeRegion} right now.
            </p>
          ) : (
            <FrontPage stories={regionStories.slice(0, 8)} />
          )}
        </div>

        {/* Evidence for the claim the masthead just made. */}
        <div className="mt-8">
          <TrendingLeanBar leans={regionStories.slice(0, 15).map((s) => s.lean)} />
        </div>

        {clusters.length > 0 && (
          <section className="mt-8" aria-labelledby="compare-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-white/10 pb-2">
              <h2
                id="compare-heading"
                className="font-display text-xl font-medium text-[#ece8e1]"
              >
                Same story, different vantage points
              </h2>
              <Link
                href="/compare"
                className="text-sm text-cyan-300 hover:underline"
              >
                Compare coverage →
              </Link>
            </div>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              {clusters.map((c) => (
                <li key={c.id}>
                  <Link
                    href="/compare"
                    className="glass block h-full rounded-2xl p-4 transition hover:border-white/25"
                  >
                    <div className="line-clamp-2 text-sm text-slate-200">
                      {c.stories[0].title}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {c.stories.length} outlets · {c.leans.length} leans
                    </div>
                    <div className="mt-2 flex gap-1.5" aria-hidden>
                      {c.leans.map((l) => (
                        <span
                          key={l}
                          className="h-2 w-2 rounded-full"
                          style={{ background: LEAN_META[l].color }}
                        />
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Personal rails come AFTER the news — a visitor should meet the
            world's front page before being handed recommendations. */}
        <div className="mt-8 space-y-4">
          <YourWireStrip />
          <OnboardingStrip />
        </div>

        {/* Now that they've seen the news, explain what makes this order real. */}
        <div className="mt-16">
          <HowStoriesRise />
        </div>

        {/* The globe now has its own page. Home links to it with a light
            promo instead of booting a WebGL scene every visit. */}
        <section id="globe" className="mt-16 scroll-mt-20">
          <Link
            href="/globe"
            className="group glass relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-3xl p-6 transition hover:border-white/25 sm:p-8"
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-2xl transition group-hover:opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, #2563eb, transparent 65%)",
              }}
              aria-hidden
            />
            <div className="relative max-w-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-300/80">
                <Icon name="globe" size={13} />
                The map
              </div>
              <h2 className="font-display mt-2 text-2xl font-medium text-[#ece8e1] sm:text-3xl">
                See where in the world it&apos;s happening
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Every story we track, plotted on a live Earth — {activeCities}{" "}
                cities reporting across {countries} countries right now.
              </p>
            </div>
            <span className="relative inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-100 transition group-hover:border-cyan-400/50 group-hover:bg-white/[0.06]">
              Open the globe
              <span className="aurora-text">→</span>
            </span>
          </Link>
        </section>

        {/* Explore by Category */}
        <section className="mt-16" aria-labelledby="cat-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/10 pb-3">
            <h2
              id="cat-heading"
              className="font-display text-2xl font-medium text-[#ece8e1]"
            >
              Browse by topic
            </h2>
            <p className="text-sm text-slate-500">
              Every topic, ranked the same way.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: `${meta.color}1f`,
            boxShadow: `0 0 20px ${meta.color}22`,
            color: meta.color,
          }}
        >
          <Icon name={CATEGORY_ICON[category] ?? "globe"} size={19} />
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
          <li className="text-xs text-slate-500">No stories right now.</li>
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
