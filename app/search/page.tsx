import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getAllStories } from "@/lib/news";
import { searchWeb, gnewsEnabled } from "@/lib/gnews";
import { LEAN_META } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

export const revalidate = 600;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const needle = query.toLowerCase();

  const [all, web] = await Promise.all([
    getAllStories(),
    query ? searchWeb(query) : Promise.resolve([]),
  ]);

  const rss = query
    ? all.filter((s) =>
        [s.title, s.summary, s.source, s.city, s.country, s.category]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(needle)),
      )
    : [];

  // Merge your curated feeds with the wider web, de-duplicated by link.
  const seen = new Set(rss.map((s) => s.link));
  const results = [...rss, ...web.filter((w) => !seen.has(w.link))];

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>

        <form
          action="/search"
          className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 focus-within:border-sky-400/40"
        >
          <span className="text-slate-500">🔍</span>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search locations, news sources, articles..."
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </form>

        <h1 className="font-display mt-8 text-2xl font-medium text-white">
          {query ? (
            <>
              {results.length} result{results.length === 1 ? "" : "s"} for “
              {query}”
            </>
          ) : (
            "Search the hub"
          )}
        </h1>
        {query && gnewsEnabled && (
          <p className="mt-1 text-xs text-slate-500">
            Searching your curated feeds + the wider web 🌐
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {results.map((story) => {
            const lean = LEAN_META[story.lean];
            return (
              <li key={story.id}>
                <Link
                  href={`/article/${story.id}`}
                  className="group block rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-sky-400/40 hover:bg-white/[0.05]"
                >
                  <h2 className="font-medium text-slate-100 group-hover:text-white">
                    {story.title}
                  </h2>
                  {story.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                      {story.summary}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-400">
                      {story.source}
                    </span>
                    {story.sourceId === "gnews" ? (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-slate-300">
                        🌐 web
                      </span>
                    ) : (
                      <span
                        className="rounded-full px-1.5 py-0.5"
                        style={{
                          color: lean.color,
                          background: `${lean.color}1a`,
                        }}
                      >
                        {lean.label}
                      </span>
                    )}
                    {story.city && <span>· 📍 {story.city}</span>}
                    <span>· {timeAgo(story.publishedAt)}</span>
                    <span className="ml-auto text-sky-400">Read More →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {query && results.length === 0 && (
          <p className="mt-6 text-slate-400">
            No stories matched. Try a country, city, source, or topic.
          </p>
        )}
      </main>
    </div>
  );
}
