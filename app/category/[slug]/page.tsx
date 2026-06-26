import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import StoryImage from "@/components/StoryImage";
import { getAllStories, storiesInCategory, type Story } from "@/lib/news";
import {
  CATEGORY_META,
  DISPLAY_CATEGORIES,
  type Category,
} from "@/lib/categories";
import { LEAN_META } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

export const revalidate = 600;

const VALID = new Set<Category>([...DISPLAY_CATEGORIES, "world"]);

export function generateStaticParams() {
  return [...VALID].map((slug) => ({ slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!VALID.has(slug as Category)) notFound();
  const category = slug as Category;
  const meta = CATEGORY_META[category];

  const stories = await getAllStories();
  const articles = storiesInCategory(stories, category);
  const sources = [...new Set(articles.map((a) => a.source))];

  return (
    <div className="min-h-screen bg-[#03040a] text-slate-200">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>

        <div className="mt-5 flex items-center gap-4">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{ background: `${meta.color}22` }}
          >
            {meta.emoji}
          </span>
          <div>
            <h1 className="text-4xl font-bold text-white">{meta.label}</h1>
            <p className="text-slate-400">{meta.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-400">
          <span>📰 {articles.length} Articles</span>
          <span>⭐ {sources.length} Sources</span>
        </div>

        {sources.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-300">Top Sources</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {sources.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-white">Latest Articles</h2>
          <span className="text-xs text-slate-500">Sorted by interest</span>
        </div>

        {articles.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-slate-400">
            No {meta.label.toLowerCase()} stories in the feed right now — check
            back soon.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((story) => (
              <ArticleCard key={story.id} story={story} categoryColor={meta.color} categoryLabel={meta.label} />
            ))}
          </div>
        )}
      </main>
    </div>
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-sky-400/40 hover:bg-white/[0.05]"
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
        <h3 className="line-clamp-2 font-semibold text-slate-100 group-hover:text-white">
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
          <span className="ml-auto">📍 {story.city} · {timeAgo(story.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
