import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ReadSourceButton from "@/components/ReadSourceButton";
import { getStoryById, summarizeStory } from "@/lib/article";
import { recordEngagement } from "@/lib/engagement";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { LEAN_META } from "@/lib/feeds";
import { CATEGORY_META } from "@/lib/categories";
import { timeAgo } from "@/lib/format";

// Summary is generated from the live article at request time (ids are runtime
// feed hashes, so we can't prerender them).
export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await getStoryById(id);

  if (!story) {
    return (
      <div className="min-h-screen bg-[#03040a] text-slate-200">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-5 py-24 text-center">
          <h1 className="text-2xl font-semibold text-white">
            This story is no longer in the live feed
          </h1>
          <p className="mt-2 text-slate-400">
            Top stories refresh every 10 minutes, so this one has rotated out.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-sky-500 px-5 py-2 font-medium text-white hover:bg-sky-400"
          >
            ← Back to the globe
          </Link>
        </main>
      </div>
    );
  }

  // Record a view (no-op without Supabase) — feeds the popularity ranking.
  await recordEngagement(story.link, story.title, story.source, "view");

  // If signed in, log to reading history (powers For You). Unique on
  // (user_id, link), so re-reads don't inflate counts.
  const user = await getUser();
  if (user) {
    const sb = await getServerSupabase();
    await sb.from("reading_history").upsert(
      {
        user_id: user.id,
        link: story.link,
        title: story.title,
        source: story.source,
        category: story.category,
      },
      { onConflict: "user_id,link", ignoreDuplicates: true },
    );
  }

  const result = await summarizeStory(story);
  const lean = LEAN_META[story.lean];
  const cat = CATEGORY_META[story.category];

  return (
    <div className="min-h-screen bg-[#03040a] text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>

        {/* Meta */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-medium"
            style={{ color: cat.color, background: `${cat.color}1a` }}
          >
            {cat.emoji} {cat.label}
          </span>
          <span className="font-medium text-slate-300">{story.source}</span>
          <span
            className="rounded-full px-2 py-0.5"
            style={{ color: lean.color, background: `${lean.color}1a` }}
          >
            {lean.label}
          </span>
          <span className="text-slate-500">
            · 📍 {story.city}, {story.country} · {timeAgo(story.publishedAt)}
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          {story.title}
        </h1>

        {story.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.imageUrl}
            alt=""
            className="mt-6 max-h-80 w-full rounded-2xl object-cover"
          />
        )}

        {/* AI summary */}
        <section className="mt-8 rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sky-300">
            <span aria-hidden>✨</span> AI Summary
            <span className="font-normal normal-case text-slate-500">
              · neutral &amp; factual
            </span>
          </h2>

          <SummaryBody result={result} fallback={story.summary} />
        </section>

        {/* Read the original */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-slate-400">
            This is a neutral summary. Read the full story, in the outlet&apos;s
            own words, at the source:
          </p>
          <ReadSourceButton
            link={story.link}
            title={story.title}
            source={story.source}
          />
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          AI-generated summary — always verify important details against the
          original source.
        </p>
      </main>
    </div>
  );
}

function SummaryBody({
  result,
  fallback,
}: {
  result: Awaited<ReturnType<typeof summarizeStory>>;
  fallback?: string;
}) {
  if (result.status === "ok") {
    return (
      <>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-200">
          {result.summary.summary.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {result.summary.keyPoints.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Key points
            </h3>
            <ul className="mt-2 space-y-1.5">
              {result.summary.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 text-sky-400">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  // Graceful fallbacks — never leave the reader with nothing.
  return (
    <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-300">
      {fallback ? <p>{fallback}</p> : null}
      <p className="text-xs text-slate-500">
        {result.status === "no-api-key"
          ? "AI summaries turn on once an ANTHROPIC_API_KEY is configured. Showing the source's own snippet for now."
          : result.status === "no-content"
            ? "This article couldn't be fetched for summarizing (it may be paywalled or block bots). Read it at the source below."
            : "The summary couldn't be generated right now. Read the full story at the source below."}
      </p>
    </div>
  );
}
