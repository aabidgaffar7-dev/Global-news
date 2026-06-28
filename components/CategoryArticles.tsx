"use client";

import { useState } from "react";
import Link from "next/link";
import StoryImage from "@/components/StoryImage";
import { LEAN_META } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";
import type { Story } from "@/lib/news";

// Articles arrive already score-sorted (Most Popular). The toggle re-sorts
// client-side so readers can flip to chronological without a round-trip.
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
  const sorted = [...articles].sort((a, b) =>
    sort === "latest"
      ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      : b.score - a.score,
  );

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

      {sorted.length === 0 ? (
        <p className="glass rounded-xl p-8 text-center text-slate-400">
          No {label.toLowerCase()} stories in the feed right now — check back
          soon.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((story) => (
            <ArticleCard
              key={story.id}
              story={story}
              categoryColor={color}
              categoryLabel={label}
            />
          ))}
        </div>
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
          <span className="ml-auto">
            📍 {story.city} · {timeAgo(story.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
