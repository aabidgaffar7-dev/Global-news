import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import CategoryArticles from "@/components/CategoryArticles";
import { FEEDS, LEAN_META } from "@/lib/feeds";
import { getAllStories } from "@/lib/news";

export const revalidate = 600;

export function generateStaticParams() {
  return FEEDS.map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feed = FEEDS.find((f) => f.id === id);
  if (!feed) return { title: "Source" };
  return {
    title: `${feed.name} — source profile`,
    description: `${feed.name} (${feed.city}, ${feed.country}) is rated ${LEAN_META[feed.lean].label} on GlobeNews. See its latest stories.`,
  };
}

export default async function SourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feed = FEEDS.find((f) => f.id === id);
  if (!feed) notFound();
  const lean = LEAN_META[feed.lean];

  const stories = await getAllStories();
  const articles = stories.filter((s) => s.sourceId === feed.id);

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <Link
          href="/sources"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Our sources
        </Link>

        <div className="mt-5">
          <h1 className="font-display text-4xl font-medium text-white">
            {feed.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span
              className="rounded-full px-3 py-1 font-medium"
              style={{ color: lean.color, background: `${lean.color}1a` }}
            >
              {lean.label}
            </span>
            <span>
              📍 {feed.city}, {feed.country}
            </span>
            <span>📰 {articles.length} stories right now</span>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-400">
            The lean label is a hand-made estimate of this outlet&apos;s typical
            vantage point, not a verdict on any single story.
          </p>
        </div>

        {articles.length > 0 ? (
          <CategoryArticles
            articles={articles}
            color={lean.color}
            label={feed.name}
          />
        ) : (
          <p className="mt-10 text-slate-500">
            No stories from {feed.name} are available right now. Check back
            soon.
          </p>
        )}
      </main>
    </div>
  );
}
