"use client";

import { useState } from "react";
import Link from "next/link";
import StoryImage from "@/components/StoryImage";
import OpinionTag from "@/components/OpinionTag";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { isOpinion } from "@/lib/compare";
import { useHideOpinion } from "@/lib/opinion-client";
import { LEAN_META, LEAN_ORDER, type Lean } from "@/lib/feeds";

// Chip order for the category row; matches the site's category cards with
// the "world" fallback bucket last.
const CATEGORY_ORDER: Category[] = [
  "politics",
  "business",
  "technology",
  "entertainment",
  "health",
  "sports",
  "world",
];
const catOf = (r: { category: string | null }): Category | "other" =>
  r.category && r.category in CATEGORY_META ? (r.category as Category) : "other";

export type SavedItem = {
  link: string;
  title: string | null;
  source: string | null;
  category: string | null;
  imageUrl: string | null;
  savedAt: string;
  /** Resolved server-side (live story, else roster name match). */
  lean: Lean;
  // Resolved server-side against the live feed: in-app route when the story
  // is still live, otherwise the source URL (external).
  href: string;
  external: boolean;
};

export default function SavedList({
  userId,
  items,
  moreHref = null,
  total,
}: {
  userId: string;
  items: SavedItem[];
  /** "Load more" link (same page, bigger limit); null when all are shown. */
  moreHref?: string | null;
  /** Everything the reader has saved (not just the loaded page). */
  total?: number;
}) {
  // Removals are tracked as a set (not a copy of `items`) so "Load more",
  // which re-renders the page with more items, keeps this list in step
  // without losing the reader's filters.
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const rows = items.filter((r) => !removed.has(r.link));
  const [pending, setPending] = useState<Set<string>>(new Set());
  // Same remembered "Hide opinion" choice as the rest of the site.
  const [hideOpinion, setHideOpinion] = useHideOpinion();
  const asStory = (r: SavedItem) => ({ link: r.link, title: r.title ?? "" });
  const [lean, setLean] = useState<Lean | "all">("all");
  const [category, setCategory] = useState<Category | "other" | "all">("all");
  const opinionCount = rows.filter((r) => isOpinion(asStory(r))).length;
  const afterOpinion = hideOpinion
    ? rows.filter((r) => !isOpinion(asStory(r)))
    : rows;
  const leanOk = (r: SavedItem) => lean === "all" || r.lean === lean;
  const catOk = (r: SavedItem) => category === "all" || catOf(r) === category;
  // Each chip row's counts follow the opinion choice and the other row, so
  // the numbers always match what tapping the chip would show.
  const leanCounts = new Map<Lean, number>();
  for (const r of afterOpinion.filter(catOk))
    leanCounts.set(r.lean, (leanCounts.get(r.lean) ?? 0) + 1);
  const catCounts = new Map<Category | "other", number>();
  for (const r of afterOpinion.filter(leanOk))
    catCounts.set(catOf(r), (catCounts.get(catOf(r)) ?? 0) + 1);
  const leans = LEAN_ORDER.filter((l) => leanCounts.has(l) || l === lean);
  const cats = ([...CATEGORY_ORDER, "other"] as const).filter(
    (c) => catCounts.has(c) || c === category,
  );
  const showLeanRow = new Set(rows.map((r) => r.lean)).size > 1;
  const showCatRow = new Set(rows.map(catOf)).size > 1;
  const visible = afterOpinion.filter((r) => leanOk(r) && catOk(r));
  const filtered = lean !== "all" || category !== "all";
  const savedTotal = Math.max(rows.length, (total ?? 0) - removed.size);

  async function remove(link: string) {
    if (pending.has(link)) return;
    setPending((p) => new Set(p).add(link));
    setRemoved((s) => new Set(s).add(link));
    const { error } = await getBrowserSupabase()
      .from("saved")
      .delete()
      .eq("user_id", userId)
      .eq("link", link);
    if (error)
      // Roll back so the list matches the DB.
      setRemoved((s) => {
        const next = new Set(s);
        next.delete(link);
        return next;
      });
    setPending((p) => {
      const next = new Set(p);
      next.delete(link);
      return next;
    });
  }

  if (rows.length === 0)
    return (
      <p className="glass mt-8 rounded-2xl p-10 text-center text-slate-400">
        Nothing saved yet — tap <span className="text-slate-200">☆ Save</span>{" "}
        on any article and it&apos;ll wait for you here.
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
            title={`${opinionCount} saved opinion piece${opinionCount === 1 ? "" : "s"}`}
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
      {showLeanRow && (
        <div
          className={`${opinionCount > 0 || hideOpinion ? "mt-3" : "mt-6"} flex flex-wrap gap-1.5 text-xs`}
          role="group"
          aria-label="Filter by outlet lean"
        >
          {(["all", ...leans] as const).map((l) => {
            const active = lean === l;
            const meta = l === "all" ? null : LEAN_META[l];
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLean(l)}
                aria-pressed={active}
                className={`rounded-full border px-2.5 py-1 transition ${
                  active
                    ? "border-transparent bg-white/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
                }`}
                style={
                  meta && active
                    ? { color: meta.color, background: `${meta.color}1f` }
                    : undefined
                }
              >
                {meta
                  ? `${meta.label} · ${leanCounts.get(l as Lean) ?? 0}`
                  : `All leans · ${afterOpinion.filter(catOk).length}`}
              </button>
            );
          })}
        </div>
      )}
      {showCatRow && (
        <div
          className={`${showLeanRow || opinionCount > 0 || hideOpinion ? "mt-3" : "mt-6"} flex flex-wrap gap-1.5 text-xs`}
          role="group"
          aria-label="Filter by category"
        >
          {(["all", ...cats] as const).map((c) => {
            const active = category === c;
            const meta = c === "all" || c === "other" ? null : CATEGORY_META[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`rounded-full border px-2.5 py-1 transition ${
                  active
                    ? "border-transparent bg-white/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
                }`}
                style={
                  meta && active
                    ? { color: meta.color, background: `${meta.color}1f` }
                    : undefined
                }
              >
                {c === "all"
                  ? `All categories · ${afterOpinion.filter(leanOk).length}`
                  : `${meta ? `${meta.emoji} ${meta.label}` : "Other"} · ${catCounts.get(c) ?? 0}`}
              </button>
            );
          })}
        </div>
      )}
      {filtered && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          Showing {visible.length} of {afterOpinion.length} loaded
          <button
            type="button"
            onClick={() => {
              setLean("all");
              setCategory("all");
            }}
            className="rounded-full border border-white/10 px-2 py-0.5 text-slate-300 transition hover:border-white/25"
          >
            ✕ Clear filters
          </button>
        </p>
      )}
      {visible.length === 0 && filtered ? (
        <p className="glass mt-6 rounded-2xl p-8 text-center text-slate-400">
          No saved articles match these filters
          {hideOpinion ? " (opinion hidden)" : ""}.{" "}
          <button
            type="button"
            onClick={() => {
              setLean("all");
              setCategory("all");
            }}
            className="text-cyan-300 underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </p>
      ) : visible.length === 0 ? (
        <p className="glass mt-6 rounded-2xl p-8 text-center text-slate-400">
          Everything you&apos;ve saved is opinion.{" "}
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
            const cat = r.category ? CATEGORY_META[r.category as Category] : null;
            return (
              <li key={r.link} className="group relative">
                <Link
                  href={r.href}
                  target={r.external ? "_blank" : undefined}
                  rel={r.external ? "noopener noreferrer" : undefined}
                  className="glass flex items-center gap-4 rounded-2xl p-3 pr-12 transition hover:-translate-y-0.5 hover:border-white/25"
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
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {cat && (
                        <span
                          className="rounded-full px-1.5 py-0.5 font-medium"
                          style={{ color: cat.color, background: `${cat.color}1a` }}
                        >
                          {cat.emoji} {cat.label}
                        </span>
                      )}
                      <span className="font-medium text-slate-300">{r.source}</span>
                      <span
                        className="rounded-full px-1.5 py-0.5"
                        style={{
                          color: LEAN_META[r.lean].color,
                          background: `${LEAN_META[r.lean].color}1a`,
                        }}
                      >
                        {LEAN_META[r.lean].label}
                      </span>
                      <OpinionTag story={{ link: r.link, title: r.title ?? "" }} />
                      <span>· saved {timeAgo(r.savedAt)}</span>
                      {r.external && <span className="text-slate-500">· source ↗</span>}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => remove(r.link)}
                  disabled={pending.has(r.link)}
                  aria-label={`Remove "${r.title}" from saved`}
                  title="Remove from saved"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-50"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {(moreHref || savedTotal > rows.length) && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-xs text-slate-500">
            Showing {rows.length} of {savedTotal} saved
          </p>
          {moreHref && (
            <Link
              href={moreHref}
              scroll={false}
              className="inline-flex rounded-full border border-white/15 px-5 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-white/[0.06]"
            >
              Load more saved articles
            </Link>
          )}
        </div>
      )}
    </>
  );
}
