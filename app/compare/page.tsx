import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { LEAN_META, LEAN_ORDER, type Lean } from "@/lib/feeds";
import { clusterCoverage, isOpinion, leanWordDiff } from "@/lib/compare";
import { getAllStories } from "@/lib/news";
import { REGIONS, regionOf } from "@/lib/regions";

export const metadata: Metadata = {
  title: "Compare coverage",
  description:
    "The same story, headlined by outlets from different political vantage points, side by side.",
};

export const revalidate = 600;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ lean?: string; region?: string; sort?: string; opinion?: string }>;
}) {
  const { lean, region, sort, opinion } = await searchParams;
  const hideOpinion = opinion === "hide";
  const activeSort = sort === "outlets" ? "outlets" : "score";
  const activeRegion = REGIONS.find((r) => r === region) ?? null;
  const activeLean = (LEAN_ORDER as string[]).includes(lean ?? "")
    ? (lean as Lean)
    : null;
  const allStories = await getAllStories();
  const stories = hideOpinion ? allStories.filter((s) => !isOpinion(s)) : allStories;
  const allClusters = clusterCoverage(stories);
  const clusters = allClusters
    .filter((c) => (activeLean ? c.leans.includes(activeLean) : true))
    .filter((c) =>
      activeRegion
        ? c.stories.some((s) => regionOf(s.country) === activeRegion)
        : true,
    );
  if (activeSort === "outlets") {
    clusters.sort(
      (a, b) => b.stories.length - a.stories.length || b.score - a.score,
    );
  }
  const href = (
    l: Lean | null,
    r: string | null,
    so: string = activeSort,
    op: boolean = hideOpinion,
  ) => {
    const q = new URLSearchParams();
    if (op) q.set("opinion", "hide");
    if (so === "outlets") q.set("sort", "outlets");
    if (l) q.set("lean", l);
    if (r) q.set("region", r);
    const str = q.toString();
    return str ? `/compare?${str}` : "/compare";
  };

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <header className="text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
            Same story, different vantage points
          </div>
          <h1 className="font-display mt-3 text-4xl font-medium text-[#ece8e1] sm:text-5xl">
            Compare <span className="aurora-text italic">coverage</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-slate-400">
            Stories reported by outlets across more than one political lean,
            grouped automatically by shared keywords. Read the headlines
            side by side, then click through to the original source.
          </p>
        </header>

        {allClusters.length > 0 && (
          <nav
            aria-label="Filter by lean"
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            <Pill href={href(null, activeRegion)} active={!activeLean}>
              All leans
            </Pill>
            {LEAN_ORDER.map((l) => (
              <Pill
                key={l}
                href={href(l, activeRegion)}
                active={activeLean === l}
                color={LEAN_META[l].color}
              >
                {LEAN_META[l].label}
              </Pill>
            ))}
          </nav>
        )}

        {allClusters.length > 0 && (
          <nav
            aria-label="Filter by region"
            className="mt-3 flex flex-wrap justify-center gap-2"
          >
            <Pill href={href(activeLean, null)} active={!activeRegion}>
              All regions
            </Pill>
            {REGIONS.map((r) => (
              <Pill key={r} href={href(activeLean, r)} active={activeRegion === r}>
                {r}
              </Pill>
            ))}
          </nav>
        )}

        {(allClusters.length > 0 || hideOpinion) && (
          <nav
            aria-label="Sort clusters"
            className="mt-3 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="text-xs text-slate-500">Sort by</span>
            <Pill href={href(activeLean, activeRegion, "score")} active={activeSort === "score"}>
              Top score
            </Pill>
            <Pill href={href(activeLean, activeRegion, "outlets")} active={activeSort === "outlets"}>
              Most outlets
            </Pill>
            <Pill
              href={href(activeLean, activeRegion, activeSort, !hideOpinion)}
              active={hideOpinion}
            >
              {hideOpinion ? "✓ Opinion hidden" : "Hide opinion"}
            </Pill>
          </nav>
        )}

        {clusters.length === 0 ? (
          <p className="glass mt-10 rounded-2xl p-6 text-center text-slate-400">
            {activeLean || activeRegion
              ? "No multi-lean stories match these filters right now."
              : "No stories are being covered from multiple vantage points right now. Check back soon."}
          </p>
        ) : (
          <div className="mt-10 space-y-5">
            {clusters.map((c) => (
              <section key={c.id} className="glass rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {c.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-white/5 px-2.5 py-1 capitalize text-slate-300"
                    >
                      {k}
                    </span>
                  ))}
                  <span className="text-slate-500">
                    {c.stories.length} outlets · {c.leans.length} leans
                  </span>
                  {c.keywords.length > 0 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(c.keywords.join(" "))}`}
                      className="ml-auto text-cyan-300/80 transition hover:text-cyan-300"
                    >
                      Search this topic →
                    </Link>
                  )}
                  {c.keywords.length > 0 && (
                    <ShareButton
                      compact
                      title={`How outlets cover: ${c.keywords.join(" ")}`}
                      path={`/search?q=${encodeURIComponent(c.keywords.join(" "))}`}
                    />
                  )}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {LEAN_ORDER.filter((l) => c.leans.includes(l)).map((lean) => (
                    <div key={lean}>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          color: LEAN_META[lean].color,
                          background: `${LEAN_META[lean].color}1a`,
                        }}
                      >
                        {LEAN_META[lean].label}
                      </span>
                      <ul className="mt-2 space-y-2">
                        {c.stories
                          .filter((s) => s.lean === lean)
                          .map((s) => (
                            <li key={s.id}>
                              <Link
                                href={`/article/${s.id}`}
                                className="text-sm text-slate-200 transition hover:text-cyan-300"
                              >
                                {s.title}
                              </Link>
                              <div className="text-xs text-slate-500">
                                {s.source}
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {(() => {
                  const diff = leanWordDiff(c).filter((d) => d.words.length > 0);
                  if (diff.length < 2) return null;
                  return (
                    <div className="mt-5 border-t border-white/5 pt-4 text-xs text-slate-400">
                      <span className="text-slate-500">Words only this side used: </span>
                      {LEAN_ORDER.map((l) => diff.find((d) => d.lean === l)).filter(Boolean).map((d) => (
                        <span key={d!.lean} className="mr-3 inline-block">
                          <span style={{ color: LEAN_META[d!.lean].color }}>
                            {LEAN_META[d!.lean].label}
                          </span>{" "}
                          {d!.words.map((w, i) => (
                            <span key={w}>
                              <Link
                                href={`/search?q=${encodeURIComponent(w)}`}
                                className="capitalize transition hover:text-cyan-300 hover:underline"
                              >
                                {w}
                              </Link>
                              {i < d!.words.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Pill({
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
