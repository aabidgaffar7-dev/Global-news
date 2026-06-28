import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import FollowManager from "@/components/FollowManager";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { getAllStories, type Story } from "@/lib/news";
import { CATEGORY_META, DISPLAY_CATEGORIES } from "@/lib/categories";
import { LEAN_META } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FollowingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = await getServerSupabase();
  const { data: followRows } = await sb
    .from("follows")
    .select("kind,value")
    .eq("user_id", user.id);
  const follows = followRows ?? [];

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
  const locations = [...new Set(stories.map((s) => s.city))].sort();

  const feed = stories
    .filter((s) => {
      if (followedCategories.has(s.category)) return true;
      if (followedLocations.has(s.city)) return true;
      const hay = `${s.title} ${s.summary ?? ""}`.toLowerCase();
      return followedKeywords.some((k) => hay.includes(k));
    })
    .slice(0, 30);

  const categories = DISPLAY_CATEGORIES.map((slug) => ({
    slug,
    label: CATEGORY_META[slug].label,
    emoji: CATEGORY_META[slug].emoji,
  }));

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <h1 className="font-display mt-6 flex items-center gap-2.5 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
          <span className="text-rose-400" aria-hidden>
            ♥
          </span>
          <span className="aurora-text italic">Following</span>
        </h1>
        <p className="text-sm text-slate-400">
          Follow topics, locations, and keywords — your feed below updates to
          match.
        </p>

        <div className="glass mt-6 rounded-3xl p-6">
          <FollowManager
            userId={user.id}
            initialFollows={follows}
            categories={categories}
            locations={locations}
          />
        </div>

        <h2 className="font-display mt-10 text-2xl font-medium text-[#ece8e1]">
          Latest <span className="aurora-text italic">Feed</span>
        </h2>
        {follows.length === 0 ? (
          <p className="glass mt-4 rounded-2xl p-8 text-center text-slate-400">
            Follow a topic, location, or keyword above to build your feed.
          </p>
        ) : feed.length === 0 ? (
          <p className="glass mt-4 rounded-2xl p-8 text-center text-slate-400">
            Nothing new from your follows right now — check back soon.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {feed.map((story) => (
              <FeedRow key={story.id} story={story} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function FeedRow({ story }: { story: Story }) {
  const lean = LEAN_META[story.lean];
  const cat = CATEGORY_META[story.category];
  return (
    <li>
      <Link
        href={`/article/${story.id}`}
        className="group glass block rounded-2xl p-4 transition hover:border-white/25 hover:bg-white/[0.05]"
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="rounded-full px-1.5 py-0.5 font-medium"
            style={{ color: cat.color, background: `${cat.color}1a` }}
          >
            {cat.emoji} {cat.label}
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
