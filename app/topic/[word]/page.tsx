import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import CategoryArticles from "@/components/CategoryArticles";
import TrendingLeanBar from "@/components/TrendingLeanBar";
import { getAllStories } from "@/lib/news";
import { isOpinion, topicKeywords } from "@/lib/compare";
import { REGIONS, regionOf } from "@/lib/regions";

export const revalidate = 600;

function clean(raw: string): string {
  return decodeURIComponent(raw).toLowerCase().trim().slice(0, 40);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ word: string }>;
}) {
  const { word } = await params;
  const w = clean(word);
  return {
    title: `${w} — coverage across outlets`,
    description: `Every current story mentioning "${w}", with the political-lean mix of the outlets covering it.`,
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ word: string }>;
  searchParams: Promise<{ region?: string; opinion?: string }>;
}) {
  const { word } = await params;
  const { region, opinion } = await searchParams;
  const w = clean(word);
  const hideOpinion = opinion === "hide";
  const activeRegion = REGIONS.find((r) => r === region) ?? null;
  if (!/^[\p{L}\p{N}]{2,40}$/u.test(w)) notFound();

  const stories = await getAllStories();
  const topical = stories.filter((s) => topicKeywords(s.title).has(w));
  const base = hideOpinion ? topical.filter((s) => !isOpinion(s)) : topical;
  const articles = activeRegion
    ? base.filter((s) => regionOf(s.country) === activeRegion)
    : base;
  const href = (r: string | null, op: boolean) => {
    const q = new URLSearchParams();
    if (r) q.set("region", r);
    if (op) q.set("opinion", "hide");
    const str = q.toString();
    return `/topic/${encodeURIComponent(w)}${str ? `?${str}` : ""}`;
  };
  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition ${
      active
        ? "border-transparent bg-white/10 text-white"
        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
    }`;
  const outlets = new Set(articles.map((s) => s.sourceId)).size;

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
        <h1 className="font-display mt-5 text-4xl font-medium capitalize text-white">
          {w}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {articles.length} {articles.length === 1 ? "story" : "stories"} from{" "}
          {outlets} {outlets === 1 ? "outlet" : "outlets"} right now ·{" "}
          <Link
            href={`/search?q=${encodeURIComponent(w)}`}
            className="text-cyan-300 hover:underline"
          >
            search the wider web
          </Link>
        </p>

        {(topical.length > 0 || activeRegion || hideOpinion) && (
          <nav aria-label="Filter stories" className="mt-5 flex flex-wrap gap-2">
            <Link href={href(null, hideOpinion)} className={pill(!activeRegion)}>
              All regions
            </Link>
            {REGIONS.map((r) => (
              <Link key={r} href={href(r, hideOpinion)} className={pill(activeRegion === r)}>
                {r}
              </Link>
            ))}
            <Link href={href(activeRegion, !hideOpinion)} className={pill(hideOpinion)}>
              {hideOpinion ? "✓ Opinion hidden" : "Hide opinion"}
            </Link>
          </nav>
        )}

        {articles.length > 0 ? (
          <>
            <TrendingLeanBar
              leans={articles.map((s) => s.lean)}
              title="Who is covering this"
              caption={`across ${articles.length} stories`}
            />
            <CategoryArticles
              articles={articles}
              color="#22d3ee"
              label={w}
            />
          </>
        ) : (
          <p className="mt-10 text-slate-500">
            {activeRegion || hideOpinion
              ? "No stories match these filters. "
              : <>No current headlines mention &ldquo;{w}&rdquo;. </>}Try{" "}
            <Link
              href={`/search?q=${encodeURIComponent(w)}`}
              className="text-cyan-300 hover:underline"
            >
              searching
            </Link>{" "}
            instead.
          </p>
        )}
      </main>
    </div>
  );
}
