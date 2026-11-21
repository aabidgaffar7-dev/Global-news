"use client";

import Link from "next/link";
import StoryImage from "@/components/StoryImage";
import OpinionTag from "@/components/OpinionTag";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { isOpinion } from "@/lib/compare";
import { useHideOpinion } from "@/lib/opinion-client";

export type HistoryItem = {
  link: string;
  title: string | null;
  source: string | null;
  category: string | null;
  viewedAt: string;
  // Resolved server-side against the live feed: in-app route while the story
  // is live, otherwise the source URL (external).
  href: string;
  external: boolean;
  imageUrl: string | null;
  lean: { label: string; color: string } | null;
};

export default function HistoryList({ items }: { items: HistoryItem[] }) {
  // Same remembered "Hide opinion" choice as the rest of the site.
  const [hideOpinion, setHideOpinion] = useHideOpinion();
  const asStory = (r: HistoryItem) => ({ link: r.link, title: r.title ?? "" });
  const opinionCount = items.filter((r) => isOpinion(asStory(r))).length;
  const visible = hideOpinion
    ? items.filter((r) => !isOpinion(asStory(r)))
    : items;

  if (items.length === 0)
    return (
      <p className="glass mt-8 rounded-2xl p-10 text-center text-slate-400">
        Nothing here yet — articles you read will show up here.
      </p>
    );

  return (
    <>
      {(opinionCount > 0 || hideOpinion) && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setHideOpinion(!hideOpinion)}
            aria-pressed={hideOpinion}
            title={`${opinionCount} opinion piece${opinionCount === 1 ? "" : "s"} in your history`}
            className={`rounded-full border px-2.5 py-1 transition ${
              hideOpinion
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25"
            }`}
          >
            {hideOpinion ? "✓ Opinion hidden" : "Hide opinion"}
          </button>
          {hideOpinion && opinionCount > 0 && (
            <span className="text-slate-500">
              {opinionCount} opinion piece{opinionCount === 1 ? "" : "s"} hidden
            </span>
          )}
        </div>
      )}
      {visible.length === 0 ? (
        <p className="glass mt-6 rounded-2xl p-8 text-center text-slate-400">
          Everything in your recent history is opinion.{" "}
          <button
            type="button"
            onClick={() => setHideOpinion(false)}
            className="text-cyan-300 underline-offset-2 hover:underline"
          >
            Show opinion
          </button>
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((r) => {
            const cat = r.category
              ? CATEGORY_META[r.category as Category]
              : null;
            return (
              <li key={r.link}>
                <Link
                  href={r.href}
                  target={r.external ? "_blank" : undefined}
                  rel={r.external ? "noopener noreferrer" : undefined}
                  className="group glass flex items-center gap-4 rounded-2xl p-3 transition hover:-translate-y-0.5 hover:border-white/25"
                >
                  <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
                    <StoryImage
                      src={r.imageUrl ?? undefined}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display line-clamp-2 font-medium text-[#ece8e1] group-hover:text-white">
                      {r.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {cat && (
                        <span
                          className="rounded-full px-1.5 py-0.5 font-medium"
                          style={{
                            color: cat.color,
                            background: `${cat.color}1a`,
                          }}
                        >
                          {cat.emoji} {cat.label}
                        </span>
                      )}
                      <span className="font-medium text-slate-300">
                        {r.source}
                      </span>
                      {r.lean && (
                        <span style={{ color: r.lean.color }}>
                          · {r.lean.label}
                        </span>
                      )}
                      <span>· read {timeAgo(r.viewedAt)}</span>
                      <OpinionTag story={asStory(r)} />
                      {r.external && (
                        <span className="text-slate-500">· source ↗</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
