import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import CategoryArticles from "@/components/CategoryArticles";
import { getAllStories, storiesInCategory } from "@/lib/news";
import {
  CATEGORY_META,
  DISPLAY_CATEGORIES,
  type Category,
} from "@/lib/categories";

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
    <div className="min-h-screen text-slate-200">
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
            <h1 className="font-display text-4xl font-medium text-white">
              {meta.label}
            </h1>
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

        <CategoryArticles
          articles={articles}
          color={meta.color}
          label={meta.label}
        />
      </main>
    </div>
  );
}
