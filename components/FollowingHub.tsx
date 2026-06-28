"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { LEAN_META, type Lean } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

type Follow = { kind: string; value: string };

export type SourceCard = {
  id: string;
  name: string;
  city: string;
  country: string;
  lean: Lean;
  count: number;
};
export type TopicCard = {
  slug: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  count: number;
};
export type LocationCard = { city: string; country: string; count: number };
export type Match = {
  kind: "source" | "keyword" | "category" | "location";
  label: string;
  color: string;
  emoji?: string;
};
export type AttributedStory = {
  id: string;
  title: string;
  summary?: string;
  source: string;
  lean: Lean;
  categoryLabel: string;
  categoryColor: string;
  categoryEmoji: string;
  city: string;
  publishedAt: string;
  match: Match;
};

const LEAN_ORDER: Lean[] = [
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "intl",
];

// Collapsed previews so these (growing) lists don't dominate the page.
const SOURCE_PREVIEW = 6;
const LOCATION_PREVIEW = 8;

export default function FollowingHub({
  userId,
  initialFollows,
  sources,
  topics,
  locations,
  feed,
}: {
  userId: string;
  initialFollows: Follow[];
  sources: SourceCard[];
  topics: TopicCard[];
  locations: LocationCard[];
  feed: AttributedStory[];
}) {
  const router = useRouter();
  const [follows, setFollows] = useState<Follow[]>(initialFollows);
  const [keyword, setKeyword] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [sourceSort, setSourceSort] = useState<"all" | "lean" | "region">("all");
  const [showAllSources, setShowAllSources] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);

  const isFollowed = (kind: string, value: string) =>
    follows.some((f) => f.kind === kind && f.value === value);

  async function toggle(kind: string, value: string) {
    const key = `${kind}:${value}`;
    if (pending.has(key)) return;
    setPending((p) => new Set(p).add(key));

    const wasFollowed = isFollowed(kind, value);
    setFollows((f) =>
      wasFollowed
        ? f.filter((x) => !(x.kind === kind && x.value === value))
        : [...f, { kind, value }],
    );

    const sb = getBrowserSupabase();
    const { error } = wasFollowed
      ? await sb
          .from("follows")
          .delete()
          .eq("user_id", userId)
          .eq("kind", kind)
          .eq("value", value)
      : await sb.from("follows").insert({ user_id: userId, kind, value });

    if (error) {
      setFollows((f) =>
        wasFollowed
          ? [...f, { kind, value }]
          : f.filter((x) => !(x.kind === kind && x.value === value)),
      );
    }
    setPending((p) => {
      const next = new Set(p);
      next.delete(key);
      return next;
    });
    router.refresh();
  }

  async function followMany(kind: string, values: string[]) {
    const missing = values.filter((v) => !isFollowed(kind, v));
    if (!missing.length) return;
    setFollows((f) => [...f, ...missing.map((v) => ({ kind, value: v }))]);
    const sb = getBrowserSupabase();
    const { error } = await sb
      .from("follows")
      .insert(missing.map((v) => ({ user_id: userId, kind, value: v })));
    if (error)
      setFollows((f) =>
        f.filter((x) => !(x.kind === kind && missing.includes(x.value))),
      );
    router.refresh();
  }

  async function removeMany(kind: string, values: string[]) {
    const present = values.filter((v) => isFollowed(kind, v));
    if (!present.length) return;
    setFollows((f) =>
      f.filter((x) => !(x.kind === kind && values.includes(x.value))),
    );
    const sb = getBrowserSupabase();
    const { error } = await sb
      .from("follows")
      .delete()
      .eq("user_id", userId)
      .eq("kind", kind)
      .in("value", values);
    if (error)
      setFollows((f) => [...f, ...present.map((v) => ({ kind, value: v }))]);
    router.refresh();
  }

  async function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    const k = keyword.trim().toLowerCase();
    setKeyword("");
    if (k && !isFollowed("keyword", k)) await toggle("keyword", k);
  }

  const counts = {
    sources: follows.filter((f) => f.kind === "source").length,
    topics: follows.filter((f) => f.kind === "category").length,
    locations: follows.filter((f) => f.kind === "location").length,
    keywords: follows.filter((f) => f.kind === "keyword").length,
  };
  const totalFollows =
    counts.sources + counts.topics + counts.locations + counts.keywords;
  const keywords = follows.filter((f) => f.kind === "keyword");

  // Lean balance — counts per band from FOLLOWED sources only (real data).
  const leanCounts = new Map<Lean, number>();
  for (const s of sources) {
    if (isFollowed("source", s.id))
      leanCounts.set(s.lean, (leanCounts.get(s.lean) ?? 0) + 1);
  }

  // Sources ordered: followed-first, within the chosen sort.
  const orderedSources = [...sources];
  if (sourceSort === "lean")
    orderedSources.sort(
      (a, b) => LEAN_ORDER.indexOf(a.lean) - LEAN_ORDER.indexOf(b.lean),
    );
  else if (sourceSort === "region")
    orderedSources.sort((a, b) =>
      `${a.country}${a.city}`.localeCompare(`${b.country}${b.city}`),
    );
  orderedSources.sort(
    (a, b) =>
      Number(isFollowed("source", b.id)) - Number(isFollowed("source", a.id)),
  );

  const allTopics = topics.map((t) => t.slug);
  const topicsAllFollowed = counts.topics === topics.length;

  // Show a short preview by default (always including everything you follow,
  // since followed items float to the front), with a "Show all" toggle.
  const sourcePreviewN = Math.max(SOURCE_PREVIEW, counts.sources);
  const visibleSources = showAllSources
    ? orderedSources
    : orderedSources.slice(0, sourcePreviewN);
  const hasMoreSources = orderedSources.length > sourcePreviewN;

  const orderedLocations = [...locations].sort(
    (a, b) =>
      Number(isFollowed("location", b.city)) -
      Number(isFollowed("location", a.city)),
  );
  const locationPreviewN = Math.max(LOCATION_PREVIEW, counts.locations);
  const visibleLocations = showAllLocations
    ? orderedLocations
    : orderedLocations.slice(0, locationPreviewN);
  const hasMoreLocations = orderedLocations.length > locationPreviewN;

  return (
    <div className="space-y-12">
      <StatRibbon counts={counts} feedLength={feed.length} />

      <LeanBalanceMeter leanCounts={leanCounts} total={counts.sources} />

      {/* ── Sources (hero) ── */}
      <Desk
        id="sources"
        title="Sources"
        accent="#22d3ee"
        subtitle={`${counts.sources} of ${sources.length} outlets followed`}
        action={
          <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
            {(["all", "lean", "region"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSourceSort(m)}
                className={`rounded-full px-2.5 py-1 capitalize transition ${
                  sourceSort === m
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "all" ? "All" : `By ${m}`}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSources.map((s) => (
            <SourceTile
              key={s.id}
              s={s}
              followed={isFollowed("source", s.id)}
              pending={pending.has(`source:${s.id}`)}
              onToggle={() => toggle("source", s.id)}
            />
          ))}
        </div>
        {hasMoreSources && (
          <button
            onClick={() => setShowAllSources((v) => !v)}
            className="mt-3 text-sm text-cyan-300/80 transition hover:text-cyan-200"
          >
            {showAllSources
              ? "Show fewer ↑"
              : `Show all ${orderedSources.length} sources →`}
          </button>
        )}
      </Desk>

      {/* ── Topics ── */}
      <Desk
        id="topics"
        title="Topics"
        accent="#a78bfa"
        subtitle={`${counts.topics} of ${topics.length} followed`}
        action={
          <button
            onClick={() =>
              topicsAllFollowed
                ? removeMany("category", allTopics)
                : followMany("category", allTopics)
            }
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/[0.06]"
          >
            {topicsAllFollowed ? "Clear all" : "Follow all"}
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <TopicTile
              key={t.slug}
              t={t}
              followed={isFollowed("category", t.slug)}
              pending={pending.has(`category:${t.slug}`)}
              onToggle={() => toggle("category", t.slug)}
            />
          ))}
        </div>
      </Desk>

      {/* ── Locations ── */}
      <Desk
        id="locations"
        title="Locations"
        accent="#ec4899"
        subtitle={`${counts.locations} of ${locations.length} followed`}
      >
        <div className="flex flex-wrap gap-2.5">
          {visibleLocations.map((l) => (
            <LocationTile
              key={l.city}
              l={l}
              followed={isFollowed("location", l.city)}
              pending={pending.has(`location:${l.city}`)}
              onToggle={() => toggle("location", l.city)}
            />
          ))}
        </div>
        {hasMoreLocations && (
          <button
            onClick={() => setShowAllLocations((v) => !v)}
            className="mt-3 text-sm text-pink-300/80 transition hover:text-pink-200"
          >
            {showAllLocations
              ? "Show fewer ↑"
              : `Show all ${orderedLocations.length} places →`}
          </button>
        )}
      </Desk>

      {/* ── Keywords ── */}
      <Desk
        id="keywords"
        title="Keywords"
        accent="#22d3ee"
        subtitle={`${counts.keywords} tracked`}
      >
        <form onSubmit={addKeyword} className="flex gap-2">
          <div className="flex flex-1 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-4 focus-within:border-cyan-400/40">
            <span className="text-slate-500">#</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="track any term — climate, elections, AI…"
              className="w-full bg-transparent py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="aurora-bg rounded-full px-4 py-2 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
          >
            Add
          </button>
        </form>
        {keywords.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((k) => (
              <button
                key={k.value}
                onClick={() => toggle("keyword", k.value)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200 transition hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-200"
              >
                #{k.value}
                <span className="text-cyan-400/60 group-hover:text-rose-300">
                  ✕
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Keywords match story titles &amp; summaries across every feed.
          </p>
        )}
      </Desk>

      {/* ── Live Wire ── */}
      <section id="wire" className="scroll-mt-[130px]">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-[#ece8e1]">
            Live <span className="aurora-text italic">Wire</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-cyan-300">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Live
          </span>
          {feed.length > 0 && (
            <span className="text-sm text-slate-500">{feed.length} stories</span>
          )}
        </div>

        {totalFollows === 0 ? (
          <div className="glass mt-4 rounded-2xl p-10 text-center">
            <p className="text-slate-200">
              Your wire is quiet. Recruit a source or follow a topic to start the
              presses.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <a
                href="#sources"
                className="aurora-bg rounded-full px-4 py-2 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
              >
                Browse sources
              </a>
              <a
                href="#topics"
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.06]"
              >
                Browse topics
              </a>
            </div>
          </div>
        ) : feed.length === 0 ? (
          <p className="glass mt-4 rounded-2xl p-8 text-center text-slate-400">
            Nothing on the wire from your follows right now — check back soon.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {feed.map((story) => (
              <WireRow key={story.id} story={story} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatRibbon({
  counts,
  feedLength,
}: {
  counts: { sources: number; topics: number; locations: number; keywords: number };
  feedLength: number;
}) {
  const tiles = [
    { href: "#sources", label: "Sources", value: counts.sources, icon: "📰", color: "#22d3ee" },
    { href: "#topics", label: "Topics", value: counts.topics, icon: "🏛️", color: "#a78bfa" },
    { href: "#locations", label: "Locations", value: counts.locations, icon: "📍", color: "#ec4899" },
    { href: "#keywords", label: "Keywords", value: counts.keywords, icon: "#", color: "#94a3b8" },
  ];
  return (
    <div className="glass sticky top-[56px] z-20 flex items-center rounded-2xl px-1 py-1">
      <div className="grid flex-1 grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
        {tiles.map((t) => (
          <a
            key={t.label}
            href={t.href}
            className="group flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-white/[0.03]"
          >
            <span className="text-sm" aria-hidden>
              {t.icon}
            </span>
            <span
              className="font-display text-xl font-medium tabular-nums"
              style={{ color: t.color }}
            >
              {t.value}
            </span>
            <span className="text-xs text-slate-400 group-hover:text-slate-300">
              {t.label}
            </span>
          </a>
        ))}
      </div>
      <a
        href="#wire"
        className="hidden shrink-0 items-center gap-1.5 px-4 text-xs text-slate-500 hover:text-slate-300 lg:flex"
      >
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
        {feedLength} live
      </a>
    </div>
  );
}

function LeanBalanceMeter({
  leanCounts,
  total,
}: {
  leanCounts: Map<Lean, number>;
  total: number;
}) {
  if (total < 1) {
    return (
      <div className="glass rounded-2xl px-5 py-4 text-sm text-slate-400">
        <span className="font-medium text-slate-300">Lean balance</span> · follow
        sources to see how your media diet spreads across the spectrum.
      </div>
    );
  }

  const bands: { lean: Lean; count: number }[] = LEAN_ORDER.map((lean) => ({
    lean,
    count: leanCounts.get(lean) ?? 0,
  }));

  // Honest verdict from the real spread (the roster skews center/international).
  let dominant: Lean = "center";
  let max = -1;
  for (const b of bands) if (b.count > max) (max = b.count), (dominant = b.lean);
  const distinct = bands.filter((b) => b.count > 0).length;
  let verdict = "Just getting started";
  let balanced = false;
  if (total >= 2) {
    if (max / total > 0.5) {
      verdict =
        dominant === "center"
          ? "Center-heavy"
          : dominant === "intl"
            ? "Mostly international"
            : `Leans ${LEAN_META[dominant].label.toLowerCase()}`;
    } else if (distinct >= 3) {
      verdict = "Well balanced";
      balanced = true;
    } else {
      verdict = "A focused mix";
    }
  }

  return (
    <div className="glass rounded-2xl px-5 py-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Lean balance
        </span>
        <span
          className={`text-sm font-medium ${balanced ? "aurora-text" : "text-slate-200"}`}
        >
          {verdict}
        </span>
      </div>
      <div
        className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-white/5"
        role="img"
        aria-label={`Followed sources by lean: ${bands
          .filter((b) => b.count)
          .map((b) => `${LEAN_META[b.lean].label} ${b.count}`)
          .join(", ")}`}
      >
        {bands.map((b) => (
          <div
            key={b.lean}
            title={`${LEAN_META[b.lean].label} · ${b.count}`}
            style={{
              flexGrow: b.count,
              minWidth: b.count ? undefined : 4,
              background: b.count ? LEAN_META[b.lean].color : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {bands
          .filter((b) => b.count > 0)
          .map((b) => (
            <span
              key={b.lean}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: LEAN_META[b.lean].color }}
              />
              {LEAN_META[b.lean].label} · {b.count}
            </span>
          ))}
      </div>
    </div>
  );
}

function Desk({
  id,
  title,
  subtitle,
  accent,
  action,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[130px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-2xl font-medium text-[#ece8e1]">
            {title}
          </h2>
          <span className="text-sm tabular-nums" style={{ color: accent }}>
            {subtitle}
          </span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FollowButton({
  followed,
  pending,
  onToggle,
  leanColor,
}: {
  followed: boolean;
  pending: boolean;
  onToggle: () => void;
  leanColor?: string;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        followed
          ? "aurora-bg text-[#07060f] hover:brightness-110"
          : "border border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]"
      }`}
      style={!followed && leanColor ? { borderColor: `${leanColor}55` } : undefined}
    >
      {followed ? "Following ✓" : "Follow"}
    </button>
  );
}

function SourceTile({
  s,
  followed,
  pending,
  onToggle,
}: {
  s: SourceCard;
  followed: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  const lean = LEAN_META[s.lean];
  return (
    <div
      className="glass flex flex-col rounded-2xl p-4 transition"
      style={followed ? { borderColor: `${lean.color}80` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display flex items-center gap-1.5 font-medium text-[#ece8e1]">
            {s.name}
            {followed && <span className="text-xs text-cyan-400">✓</span>}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            📍 {s.city} · {s.country}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{ color: lean.color, background: `${lean.color}1a` }}
        >
          {lean.label}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-[11px] tabular-nums text-slate-500">
          {s.count > 0 ? `${s.count} in your feed` : "No stories right now"}
        </span>
        <FollowButton
          followed={followed}
          pending={pending}
          onToggle={onToggle}
          leanColor={lean.color}
        />
      </div>
    </div>
  );
}

function TopicTile({
  t,
  followed,
  pending,
  onToggle,
}: {
  t: TopicCard;
  followed: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className="glass relative flex flex-col overflow-hidden rounded-2xl p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-50"
      style={
        followed
          ? { borderColor: `${t.color}80`, background: `${t.color}14` }
          : undefined
      }
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: t.color }}
      />
      <div className="flex items-start justify-between">
        <span className={`text-2xl transition ${followed ? "scale-110" : ""}`}>
          {t.emoji}
        </span>
        {followed && (
          <span className="text-xs font-semibold" style={{ color: t.color }}>
            Following ✓
          </span>
        )}
      </div>
      <h3 className="font-display mt-2 font-medium text-[#ece8e1]">{t.label}</h3>
      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
        {t.description}
      </p>
      <span className="mt-2 text-[11px] tabular-nums text-slate-500">
        {t.count} stories now
      </span>
    </button>
  );
}

function LocationTile({
  l,
  followed,
  pending,
  onToggle,
}: {
  l: LocationCard;
  followed: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`glass flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-sm transition ${
        followed ? "" : ""
      }`}
      style={followed ? { borderColor: "#ec489980" } : undefined}
    >
      <button
        onClick={onToggle}
        disabled={pending}
        className="flex items-center gap-1.5 disabled:opacity-50"
      >
        <span className="text-pink-400">📍</span>
        <span className="text-slate-200">{l.city}</span>
        <span className="text-xs tabular-nums text-slate-500">{l.count}</span>
      </button>
      {followed && (
        <Link
          href="/#globe"
          title="See it on the globe"
          className="rounded-full bg-white/5 px-1.5 text-xs text-slate-400 hover:text-cyan-300"
        >
          🌐
        </Link>
      )}
      <button
        onClick={onToggle}
        disabled={pending}
        className={`rounded-full px-2 py-0.5 text-xs font-semibold transition disabled:opacity-50 ${
          followed
            ? "text-pink-300 hover:text-rose-300"
            : "aurora-bg text-[#07060f] hover:brightness-110"
        }`}
      >
        {followed ? "✓" : "+"}
      </button>
    </div>
  );
}

function WireRow({ story }: { story: AttributedStory }) {
  const lean = LEAN_META[story.lean];
  const m = story.match;
  return (
    <li>
      <Link
        href={`/article/${story.id}`}
        className="group glass block rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-white/25"
      >
        <span
          className="mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ color: m.color, background: `${m.color}1a` }}
        >
          Following · {m.emoji ? `${m.emoji} ` : ""}
          {m.label}
        </span>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="rounded-full px-1.5 py-0.5 font-medium"
            style={{ color: story.categoryColor, background: `${story.categoryColor}1a` }}
          >
            {story.categoryEmoji} {story.categoryLabel}
          </span>
          <span className="font-medium text-slate-300">{story.source}</span>
          <span style={{ color: lean.color }}>· {lean.label}</span>
          <span className="text-slate-500">
            · 📍 {story.city} · {timeAgo(story.publishedAt)}
          </span>
        </div>
        <h3 className="font-display font-medium text-[#ece8e1] group-hover:text-white">
          {story.title}
        </h3>
        {story.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">
            {story.summary}
          </p>
        )}
      </Link>
    </li>
  );
}
