import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getAllStories } from "@/lib/news";
import { trendingTopics } from "@/lib/compare";

export const revalidate = 600;

export const metadata = {
  title: "Topics — what outlets are covering",
  description:
    "Words that several outlets are headlining right now. Open one to see every story and the political-lean mix covering it.",
};

export default async function TopicsPage() {
  const stories = await getAllStories();
  const topics = trendingTopics(stories, {
    limit: 40,
    minOutlets: 2,
    window: 200,
  });

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>
        <h1 className="font-display mt-5 text-4xl font-medium text-white">
          Topics
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Words that more than one outlet is headlining right now, ranked by how
          many different outlets use them.
        </p>
        {topics.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t.word}>
                <Link
                  href={`/topic/${encodeURIComponent(t.word)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm capitalize text-slate-300 transition hover:bg-white/[0.07]"
                >
                  {t.word}
                  <span className="text-xs normal-case text-slate-500">
                    {t.outlets} outlets
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-slate-500">
            No shared topics right now. Check back after the next news refresh.
          </p>
        )}
      </main>
    </div>
  );
}
