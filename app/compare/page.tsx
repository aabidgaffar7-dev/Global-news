import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { LEAN_META, LEAN_ORDER } from "@/lib/feeds";
import { clusterCoverage } from "@/lib/compare";
import { getAllStories } from "@/lib/news";

export const metadata: Metadata = {
  title: "Compare coverage",
  description:
    "The same story, headlined by outlets from different political vantage points, side by side.",
};

export const revalidate = 600;

export default async function ComparePage() {
  const stories = await getAllStories();
  const clusters = clusterCoverage(stories);

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

        {clusters.length === 0 ? (
          <p className="glass mt-10 rounded-2xl p-6 text-center text-slate-400">
            No stories are being covered from multiple vantage points right
            now. Check back soon.
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
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
