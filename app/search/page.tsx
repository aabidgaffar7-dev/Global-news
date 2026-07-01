import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SearchResults from "@/components/SearchResults";
import { getAllStories } from "@/lib/news";
import { searchWeb, gnewsEnabled } from "@/lib/gnews";

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

  // Merge curated feeds with the wider web, de-duplicated by link.
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
          className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 focus-within:border-cyan-400/40"
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

        {query ? (
          <SearchResults
            results={results}
            query={query}
            webEnabled={gnewsEnabled}
          />
        ) : (
          <h1 className="font-display mt-8 text-2xl font-medium text-white">
            Search the hub
          </h1>
        )}
      </main>
    </div>
  );
}
