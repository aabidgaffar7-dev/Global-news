"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LEAN_META, type Lean } from "@/lib/feeds";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { REGIONS, regionOf } from "@/lib/regions";
import { storyPlace, timeAgo } from "@/lib/format";
import { isOpinion } from "@/lib/compare";
import OpinionTag from "@/components/OpinionTag";
import SaveButton from "@/components/SaveButton";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { supabaseEnabled } from "@/lib/supabase";
import { useHideOpinion } from "@/lib/opinion-client";
import type { Story } from "@/lib/news";

type SourceFilter = "all" | "feeds" | "web";
// null while loading (stars stay hidden so they never flash the wrong state).
type SavedState = { userId: string | null; links: Set<string> } | null;
type Sort = "relevant" | "latest";

export default function SearchResults({
  results,
  query,
  webEnabled,
}: {
  results: Story[];
  query: string;
  webEnabled: boolean;
}) {
  const [cat, setCat] = useState<Category | "all">("all");
  const [lean, setLean] = useState<Lean | "all">("all");
  const [region, setRegion] = useState<string>("all");
  const [src, setSrc] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<Sort>("relevant");
  const [hideOpinion, setHideOpinion] = useHideOpinion();
  const [saved, setSaved] = useState<SavedState>(null);
  const opinionCount = useMemo(
    () => results.filter((r) => isOpinion(r)).length,
    [results],
  );

  // The page is cached for everyone, so the reader's saved links load once in
  // the browser. Bounded: readers with more saves than this just see "☆ Save"
  // on older ones, and saving again is a no-op (upsert ignores duplicates).
  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    (async () => {
      const sb = getBrowserSupabase();
      const { data: auth } = await sb.auth.getUser();
      const userId = auth.user?.id ?? null;
      const links = new Set<string>();
      if (userId) {
        const { data } = await sb
          .from("saved")
          .select("link")
          .eq("user_id", userId)
          .order("saved_at", { ascending: false })
          .limit(500);
        for (const row of data ?? []) links.add(row.link as string);
      }
      if (!cancelled) setSaved({ userId, links });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cats = useMemo(
    () => [...new Set(results.map((r) => r.category))],
    [results],
  );
  const leans = useMemo(
    () => [...new Set(results.map((r) => r.lean))],
    [results],
  );
  const regions = useMemo(() => {
    const present = new Set(results.map((r) => regionOf(r.country)));
    return REGIONS.filter((r) => present.has(r));
  }, [results]);
  const hasWeb = results.some((r) => r.sourceId === "gnews");
  const hasFeeds = results.some((r) => r.sourceId !== "gnews");

  const filtered = useMemo(() => {
    let list = results.filter(
      (r) =>
        (cat === "all" || r.category === cat) &&
        (lean === "all" || r.lean === lean) &&
        (region === "all" || regionOf(r.country) === region) &&
        (!hideOpinion || !isOpinion(r)) &&
        (src === "all" ||
          (src === "web" ? r.sourceId === "gnews" : r.sourceId !== "gnews")),
    );
    if (sort === "latest") {
      list = [...list].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
    }
    return list;
  }, [results, cat, lean, region, src, sort, hideOpinion]);

  return (
    <>
      <h1 className="font-display mt-8 text-2xl font-medium text-white">
        {filtered.length} result{filtered.length === 1 ? "" : "s"} for “{query}”
      </h1>
      {webEnabled && hasWeb && (
        <p className="mt-1 text-xs text-slate-500">
          Searching your curated feeds + the wider web 🌐
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {hasWeb && hasFeeds && (
            <Facets>
              <Chip active={src === "all"} onClick={() => setSrc("all")}>
                All sources
              </Chip>
              <Chip active={src === "feeds"} onClick={() => setSrc("feeds")}>
                Trusted feeds
              </Chip>
              <Chip active={src === "web"} onClick={() => setSrc("web")}>
                🌐 Wider web
              </Chip>
            </Facets>
          )}
          {cats.length > 1 && (
            <Facets>
              <Chip active={cat === "all"} onClick={() => setCat("all")}>
                All topics
              </Chip>
              {cats.map((c) => (
                <Chip
                  key={c}
                  active={cat === c}
                  color={CATEGORY_META[c]?.color}
                  onClick={() => setCat(c)}
                >
                  {CATEGORY_META[c]?.emoji} {CATEGORY_META[c]?.label ?? c}
                </Chip>
              ))}
            </Facets>
          )}
          {regions.length > 1 && (
            <Facets>
              <Chip active={region === "all"} onClick={() => setRegion("all")}>
                All regions
              </Chip>
              {regions.map((r) => (
                <Chip
                  key={r}
                  active={region === r}
                  onClick={() => setRegion(r)}
                >
                  🌍 {r}
                </Chip>
              ))}
            </Facets>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {leans.length > 1 ? (
              <Facets>
                <Chip active={lean === "all"} onClick={() => setLean("all")}>
                  Any lean
                </Chip>
                {leans.map((l) => (
                  <Chip
                    key={l}
                    active={lean === l}
                    color={LEAN_META[l].color}
                    onClick={() => setLean(l)}
                  >
                    {LEAN_META[l].label}
                  </Chip>
                ))}
              </Facets>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {opinionCount > 0 && (
                <Chip
                  active={hideOpinion}
                  onClick={() => setHideOpinion(!hideOpinion)}
                  pressed={hideOpinion}
                  title={`${opinionCount} opinion piece${opinionCount === 1 ? "" : "s"} in these results`}
                >
                  {hideOpinion ? "✓ Opinion hidden" : "Hide opinion"}
                </Chip>
              )}
              <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
                <button
                  onClick={() => setSort("relevant")}
                  className={sortCls(sort === "relevant")}
                >
                  Relevant
                </button>
                <button
                  onClick={() => setSort("latest")}
                  className={sortCls(sort === "latest")}
                >
                  Latest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-slate-400">
          {results.length === 0
            ? "No stories matched. Try a country, city, source, or topic."
            : "No stories match these filters."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((story) => (
            <ResultRow
              key={story.id}
              story={story}
              saved={saved}
              onSavedChange={(link, on) =>
                setSaved((prev) => {
                  if (!prev) return prev;
                  const links = new Set(prev.links);
                  if (on) links.add(link);
                  else links.delete(link);
                  return { ...prev, links };
                })
              }
            />
          ))}
        </ul>
      )}
    </>
  );
}

function sortCls(active: boolean) {
  return `rounded-full px-2.5 py-1 transition ${
    active ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
  }`;
}

function Facets({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
  active,
  onClick,
  color,
  pressed,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  pressed?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      title={title}
      className={`rounded-full border px-2.5 py-1 text-xs transition ${
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
    </button>
  );
}

function ResultRow({
  story,
  saved,
  onSavedChange,
}: {
  story: Story;
  saved: SavedState;
  // Keeps the page's saved set current, so a row that is filtered out and
  // back in shows the right star.
  onSavedChange: (link: string, saved: boolean) => void;
}) {
  const lean = LEAN_META[story.lean];
  return (
    <li className="relative">
      <Link
        href={`/article/${story.id}`}
        className="group block rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
      >
        <h2
          className={`font-display font-medium text-slate-100 group-hover:text-white ${
            saved ? "pr-20" : ""
          }`}
        >
          {story.title}
        </h2>
        {story.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">
            {story.summary}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="font-medium text-slate-400">{story.source}</span>
          {story.sourceId === "gnews" ? (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-slate-300">
              🌐 web
            </span>
          ) : (
            <span
              className="rounded-full px-1.5 py-0.5"
              style={{ color: lean.color, background: `${lean.color}1a` }}
            >
              {lean.label}
            </span>
          )}
          <OpinionTag story={story} />
          {storyPlace(story) && <span>· 📍 {storyPlace(story)}</span>}
          <span>· {timeAgo(story.publishedAt)}</span>
          <span className="aurora-text ml-auto font-medium">Read More →</span>
        </div>
      </Link>
      {/* Outside the link so the star doesn't open the article. */}
      {saved && (
        <div className="absolute right-4 top-4 text-[11px]">
          <SaveButton
            compact
            refresh={false}
            onChange={(on) => onSavedChange(story.link, on)}
            userId={saved.userId}
            initialSaved={saved.links.has(story.link)}
            story={{
              storyId: story.id,
              link: story.link,
              title: story.title,
              source: story.source,
              category: story.category,
              imageUrl: story.imageUrl,
            }}
          />
        </div>
      )}
    </li>
  );
}
