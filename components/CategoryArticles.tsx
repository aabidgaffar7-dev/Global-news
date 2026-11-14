"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StoryImage from "@/components/StoryImage";
import OpinionTag from "@/components/OpinionTag";
import { LEAN_META, LEAN_ORDER, type Lean } from "@/lib/feeds";
import { REGIONS, regionOf } from "@/lib/regions";
import { storyPlace, timeAgo } from "@/lib/format";
import { isOpinion } from "@/lib/compare";
import { useHideOpinion } from "@/lib/opinion-client";
import type { Story } from "@/lib/news";

// Articles arrive already score-sorted (Most Popular). The toggle re-sorts
// client-side so readers can flip to chronological without a round-trip.
const PAGE = 24;

export default function CategoryArticles({
  articles,
  color,
  label,
}: {
  articles: Story[];
  color: string;
  label: string;
}) {
  const [sort, setSort] = useState<"popular" | "latest">("popular");
  const [shown, setShown] = useState(PAGE);
  const [region, setRegion] = useState("all");
  const [lean, setLean] = useState<Lean | "all">("all");
  const [hideOpinion, setHideOpinion] = useHideOpinion();
  const opinionCount = useMemo(
    () => articles.filter((a) => isOpinion(a)).length,
    [articles],
  );
  const base = useMemo(
    () => (hideOpinion ? articles.filter((a) => !isOpinion(a)) : articles),
    [articles, hideOpinion],
  );
  const regionCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of base) {
      const r = regionOf(a.country);
      m.set(r, (m.get(r) ?? 0) + 1);
    }
    return m;
  }, [base]);
  const regions = REGIONS.filter((r) => regionCounts.has(r));
  const inRegion =
    region === "all"
      ? base
      : base.filter((a) => regionOf(a.country) === region);
  // Lean counts follow the region choice, so the chips show what's actually
  // there. Outlet pages have a single lean, so the row hides itself.
  const leanCounts = new Map<Lean, number>();
  for (const a of inRegion) leanCounts.set(a.lean, (leanCounts.get(a.lean) ?? 0) + 1);
  const leans = LEAN_ORDER.filter((l) => leanCounts.has(l) || l === lean);
  const leanAvailable = new Set(base.map((a) => a.lean)).size > 1;
  const pool =
    lean === "all" ? inRegion : inRegion.filter((a) => a.lean === lean);
  const sorted = [...pool].sort((a, b) =>
    sort === "latest"
      ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      : b.score - a.score,
  );
  const visible = sorted.slice(0, shown);

  return (
    <>
      <div className="mt-8 mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-medium text-white">
          {sort === "latest" ? "Latest" : "Most Popular"} Articles
        </h2>
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
          <button
            onClick={() => setSort("popular")}
            className={`rounded-full px-3 py-1.5 transition ${
              sort === "popular"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Most Popular
          </button>
          <button
            onClick={() => setSort("latest")}
            className={`rounded-full px-3 py-1.5 transition ${
              sort === "latest"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {(regions.length > 1 || opinionCount > 0) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {regions.length > 1 && ["all", ...regions].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRegion(r);
                setShown(PAGE);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                region === r
                  ? "border-transparent bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
              }`}
            >
              {r === "all"
                ? "All regions"
                : `🌍 ${r} · ${regionCounts.get(r)}`}
            </button>
          ))}
          {opinionCount > 0 && (
            <button
              onClick={() => {
                setHideOpinion(!hideOpinion);
                setShown(PAGE);
              }}
              aria-pressed={hideOpinion}
              title={`${opinionCount} opinion piece${opinionCount === 1 ? "" : "s"} in this section`}
              className={`ml-auto rounded-full border px-2.5 py-1 text-xs transition ${
                hideOpinion
                  ? "border-transparent bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
              }`}
            >
              {hideOpinion ? "✓ Opinion hidden" : "Hide opinion"}
            </button>
          )}
        </div>
      )}

      {leanAvailable && (
        <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Filter by outlet lean">
          <button
            onClick={() => {
              setLean("all");
              setShown(PAGE);
            }}
            aria-pressed={lean === "all"}
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              lean === "all"
                ? "border-transparent bg-white/10 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            Any lean
          </button>
          {leans.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLean(l);
                setShown(PAGE);
              }}
              aria-pressed={lean === l}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                lean === l
                  ? "border-transparent bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: LEAN_META[l].color }}
              />
              {LEAN_META[l].label} · {leanCounts.get(l) ?? 0}
            </button>
          ))}
        </div>
      )}

      {(region !== "all" || lean !== "all") && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>
            Showing {sorted.length} of {base.length} stories
          </span>
          <button
            onClick={() => {
              setRegion("all");
              setLean("all");
              setShown(PAGE);
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-300 transition hover:bg-white/[0.07]"
          >
            ✕ Clear filters
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="glass rounded-xl p-8 text-center text-slate-400">
          {base.length === 0 && articles.length > 0
            ? `Only opinion pieces in ${label.toLowerCase()} right now. Turn off "Hide opinion" to see them.`
            : inRegion.length > 0 && lean !== "all"
            ? `No ${LEAN_META[lean].label.toLowerCase()} outlets have ${label.toLowerCase()} stories${region === "all" ? "" : " from this region"} right now.`
            : articles.length > 0
            ? `No ${label.toLowerCase()} stories from this region right now.`
            : `No ${label.toLowerCase()} stories in the feed right now — check back soon.`}
        </p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((story) => (
              <ArticleCard
                key={story.id}
                story={story}
                categoryColor={color}
                categoryLabel={label}
              />
            ))}
          </div>
          {sorted.length > shown && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShown((n) => n + PAGE)}
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.04]"
              >
                Show more ({sorted.length - shown} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ArticleCard({
  story,
  categoryColor,
  categoryLabel,
}: {
  story: Story;
  categoryColor: string;
  categoryLabel: string;
}) {
  const lean = LEAN_META[story.lean];
  return (
    <Link
      href={`/article/${story.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
    >
      <div className="relative h-40 w-full">
        <StoryImage src={story.imageUrl} className="h-full w-full object-cover" />
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ color: categoryColor, background: "rgba(0,0,0,0.55)" }}
        >
          {categoryLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display line-clamp-2 font-medium text-slate-100 group-hover:text-white">
          {story.title}
        </h3>
        {story.summary && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-400">
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
          <OpinionTag story={story} />
          <span className="ml-auto">
            {storyPlace(story) ? `📍 ${storyPlace(story)} · ` : ""}
            {timeAgo(story.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
