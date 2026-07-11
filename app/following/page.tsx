import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import FollowingHub, {
  type AttributedStory,
  type Match,
} from "@/components/FollowingHub";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { getAllStories } from "@/lib/news";
import { CATEGORY_META, DISPLAY_CATEGORIES } from "@/lib/categories";
import { FEEDS } from "@/lib/feeds";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your Newsroom" };

export default async function FollowingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = await getServerSupabase();
  const { data: followRows } = await sb
    .from("follows")
    .select("kind,value")
    .eq("user_id", user.id);
  const follows = followRows ?? [];

  const followedSources = new Set(
    follows.filter((f) => f.kind === "source").map((f) => f.value),
  );
  const followedCategories = new Set(
    follows.filter((f) => f.kind === "category").map((f) => f.value),
  );
  const followedLocations = new Set(
    follows.filter((f) => f.kind === "location").map((f) => f.value),
  );
  const followedKeywords = follows
    .filter((f) => f.kind === "keyword")
    .map((f) => f.value);

  const stories = await getAllStories();

  // Live counts (precomputed server-side so cards don't recompute).
  const sourceCount = new Map<string, number>();
  const topicCount = new Map<string, number>();
  const locationCount = new Map<string, number>();
  const locationCountry = new Map<string, string>();
  for (const s of stories) {
    sourceCount.set(s.sourceId, (sourceCount.get(s.sourceId) ?? 0) + 1);
    topicCount.set(s.category, (topicCount.get(s.category) ?? 0) + 1);
    locationCount.set(s.city, (locationCount.get(s.city) ?? 0) + 1);
    locationCountry.set(s.city, s.country);
  }

  // Sources: the full curated roster (a 0-story outlet must still be
  // followable) PLUS every broad-coverage outlet in the current feed — so
  // readers can follow the outlets they actually read, not just our 19.
  const broadOutlets = new Map<string, { name: string; count: number }>();
  for (const s of stories) {
    if (!s.sourceId.startsWith("nd:")) continue;
    const entry = broadOutlets.get(s.sourceId) ?? { name: s.source, count: 0 };
    entry.count++;
    broadOutlets.set(s.sourceId, entry);
  }
  const sources = [
    ...FEEDS.map((f) => ({
      id: f.id,
      name: f.name,
      city: f.city,
      country: f.country,
      lean: f.lean,
      count: sourceCount.get(f.id) ?? 0,
    })),
    ...[...broadOutlets.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, e]) => ({
        id,
        name: e.name,
        city: "",
        country: "Broad coverage",
        lean: "unrated" as const,
        count: e.count,
      })),
    // Outlets the user follows that aren't in the current feed still need a
    // card (so they can see + unfollow them).
    ...[...followedSources]
      .filter((id) => id.startsWith("nd:") && !broadOutlets.has(id))
      .map((id) => ({
        id,
        name: id.slice(3).replace(/-/g, " "),
        city: "",
        country: "Broad coverage",
        lean: "unrated" as const,
        count: 0,
      })),
  ];

  const topics = DISPLAY_CATEGORIES.map((slug) => ({
    slug,
    label: CATEGORY_META[slug].label,
    emoji: CATEGORY_META[slug].emoji,
    color: CATEGORY_META[slug].color,
    description: CATEGORY_META[slug].description,
    count: topicCount.get(slug) ?? 0,
  }));

  // Locations reflect what's actually in the live feed.
  const locations = [...locationCount.keys()].sort().map((city) => ({
    city,
    country: locationCountry.get(city) ?? "",
    count: locationCount.get(city) ?? 0,
  }));

  // Keyword follows match on word boundaries — plain substring floods the
  // wire with false positives for short terms ("ai" inside "said").
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keywordRes = followedKeywords.map((k) => ({
    k,
    re: new RegExp(`\\b${escapeRe(k)}\\b`, "i"),
  }));

  // A location follow only matches stories actually ABOUT that city — not
  // stories whose coords fell back to an outlet HQ there.
  const locationMatch = (s: (typeof stories)[number]) =>
    s.placement === "city" && followedLocations.has(s.city);

  // The Live Wire: any story matching any follow, with why-followed attribution.
  function attribute(s: (typeof stories)[number]): Match {
    if (followedSources.has(s.sourceId))
      return { kind: "source", label: s.source, color: "#22d3ee" };
    const hay = `${s.title} ${s.summary ?? ""}`;
    const kw = keywordRes.find((x) => x.re.test(hay));
    if (kw) return { kind: "keyword", label: `#${kw.k}`, color: "#22d3ee" };
    if (followedCategories.has(s.category)) {
      const m = CATEGORY_META[s.category];
      return { kind: "category", label: m.label, color: m.color, emoji: m.emoji };
    }
    return { kind: "location", label: s.city, color: "#ec4899", emoji: "📍" };
  }

  const feed: AttributedStory[] = stories
    .filter((s) => {
      if (followedSources.has(s.sourceId)) return true;
      if (followedCategories.has(s.category)) return true;
      if (locationMatch(s)) return true;
      const hay = `${s.title} ${s.summary ?? ""}`;
      return keywordRes.some((x) => x.re.test(hay));
    })
    // A wire reads newest-first (the score-sort is for leaderboards).
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, 30)
    .map((s) => {
      const cat = CATEGORY_META[s.category];
      return {
        id: s.id,
        title: s.title,
        summary: s.summary,
        source: s.source,
        lean: s.lean,
        categoryLabel: cat.label,
        categoryColor: cat.color,
        categoryEmoji: cat.emoji,
        city: s.city,
        placement: s.placement,
        publishedAt: s.publishedAt,
        match: attribute(s),
      };
    });

  const newest = feed[0]?.publishedAt;
  const totalFollows = follows.length;

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        {/* Masthead */}
        <header className="mt-6 border-b border-white/10 pb-5">
          <h1 className="font-display text-3xl font-medium text-[#ece8e1] sm:text-4xl">
            Your <span className="aurora-text italic">Newsroom</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            {totalFollows === 0
              ? "An empty masthead — start following to print your front page"
              : `Edited from ${followedSources.size} sources · ${followedCategories.size} topics · ${followedLocations.size} places · ${followedKeywords.length} keywords${
                  newest ? ` · updated ${relative(newest)}` : ""
                }`}
          </p>
        </header>

        <div className="mt-8">
          <FollowingHub
            userId={user.id}
            initialFollows={follows}
            sources={sources}
            topics={topics}
            locations={locations}
            feed={feed}
          />
        </div>
      </main>
    </div>
  );
}

function relative(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
