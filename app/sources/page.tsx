import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { LEAN_META, LEAN_ORDER, FEEDS } from "@/lib/feeds";

export const metadata: Metadata = {
  title: "Our sources",
  description:
    "Every hand-rated outlet on GlobeNews, grouped by political lean, with where each one is based.",
};

export default function SourcesPage() {
  const groups = LEAN_ORDER.map((lean) => ({
    lean,
    feeds: FEEDS.filter((f) => f.lean === lean).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  })).filter((g) => g.feeds.length > 0);
  const countries = new Set(FEEDS.map((f) => f.country)).size;

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <Link
          href="/about"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← About & Methodology
        </Link>

        <header className="mt-8 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
            How we rate outlets
          </div>
          <h1 className="font-display mt-3 text-4xl font-medium text-[#ece8e1] sm:text-5xl">
            Our <span className="aurora-text italic">sources</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-slate-400">
            {FEEDS.length} hand-rated outlets across {countries} countries.
            Each label describes the outlet&apos;s typical vantage point — an
            estimate to read with, not a verdict. &quot;International&quot;
            marks pan-regional outlets whose vantage point depends on their
            home state or region.
          </p>
        </header>

        <div className="mt-10 space-y-4">
          {groups.map(({ lean, feeds }) => (
            <section key={lean} className="glass rounded-2xl p-6">
              <h2 className="flex items-center gap-3 font-display text-xl font-medium text-[#ece8e1]">
                <span
                  className="rounded-full px-3 py-1 font-sans text-sm font-medium"
                  style={{
                    color: LEAN_META[lean].color,
                    background: `${LEAN_META[lean].color}1a`,
                  }}
                >
                  {LEAN_META[lean].label}
                </span>
                <span className="text-sm font-normal text-slate-500">
                  {feeds.length} {feeds.length === 1 ? "outlet" : "outlets"}
                </span>
              </h2>
              <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {feeds.map((f) => (
                  <li key={f.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-slate-200">{f.name}</span>
                    <span className="text-xs text-slate-500">{f.country}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Ratings are reviewed by hand and may change. Sources that flow in
          through broad news APIs and haven&apos;t been assessed show as
          &quot;Unrated&quot;.
        </p>
      </main>
    </div>
  );
}
