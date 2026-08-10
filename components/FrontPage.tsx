import Link from "next/link";
import StoryImage from "@/components/StoryImage";
import RankInfo from "@/components/RankInfo";
import { CATEGORY_META } from "@/lib/categories";
import { LEAN_META } from "@/lib/feeds";
import { formatCount, storyPlace, timeAgo } from "@/lib/format";
import type { Story } from "@/lib/news";

// The front page: the first interactive thing a visitor meets is THE NEWS,
// laid out the way a newspaper lays it out — one lead story, then a column of
// runners-up. Section shape carries the message ("here's what's happening
// right now") so the copy doesn't have to.
export default function FrontPage({ stories }: { stories: Story[] }) {
  if (stories.length === 0) {
    return (
      <p className="glass rounded-2xl p-8 text-center text-slate-400">
        Stories are warming up — refresh in a moment.
      </p>
    );
  }

  // A front page's lead needs art. Promote the highest-ranked story that
  // actually has an image (searching only the top few, so the lead is always
  // genuinely a top story) and show every story's TRUE rank either way.
  const ranked = stories.map((s, i) => ({ story: s, rank: i + 1 }));
  const leadPick = ranked.slice(0, 4).find((r) => r.story.imageUrl) ?? ranked[0];
  const rest = ranked.filter((r) => r !== leadPick);
  const column = rest.slice(0, 3);
  const strip = rest.slice(3, 7);

  return (
    <section aria-labelledby="front-page-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h2
          id="front-page-heading"
          className="font-display flex items-center gap-2.5 text-2xl font-medium text-[#ece8e1]"
        >
          <span className="pulse-dot h-2 w-2 rounded-full bg-cyan-400" />
          Top stories right now
        </h2>
        <div className="flex items-center gap-3">
          <RankInfo />
          <Link
            href="/popular"
            className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Full leaderboard →
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <LeadStory story={leadPick.story} rank={leadPick.rank} />
        <ol className="flex flex-col divide-y divide-white/10">
          {column.map((r) => (
            <RankedRow key={r.story.id} story={r.story} rank={r.rank} />
          ))}
        </ol>
      </div>

      {strip.length > 0 && (
        <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {strip.map((r) => (
            <StripCard key={r.story.id} story={r.story} rank={r.rank} />
          ))}
        </div>
      )}
    </section>
  );
}

function Meta({ story }: { story: Story }) {
  const lean = LEAN_META[story.lean];
  const place = storyPlace(story);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
      <span className="font-medium text-slate-300">{story.source}</span>
      <span
        className="rounded-full px-1.5 py-0.5"
        style={{ color: lean.color, background: `${lean.color}1a` }}
      >
        {lean.label}
      </span>
      {place && <span>· 📍 {place}</span>}
      <span>· {timeAgo(story.publishedAt)}</span>
      {story.views ? (
        <span className="text-cyan-300/80">· 👁 {formatCount(story.views)}</span>
      ) : null}
    </div>
  );
}

function LeadStory({ story, rank }: { story: Story; rank: number }) {
  const cat = CATEGORY_META[story.category];
  return (
    <Link href={`/article/${story.id}`} className="group block">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
        <StoryImage
          src={story.imageUrl}
          tint={cat.color}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07060f] via-[#07060f]/25 to-transparent" />
        <span
          className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ color: cat.color, background: "rgba(7,6,15,0.7)" }}
        >
          {cat.emoji} {cat.label}
        </span>
        <span className="aurora-bg absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#07060f]">
          #{rank} most read
        </span>
      </div>
      <h3 className="font-display mt-4 text-balance text-2xl font-medium leading-tight text-[#ece8e1] transition group-hover:text-white sm:text-3xl">
        {story.title}
      </h3>
      {story.summary && (
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-slate-400">
          {story.summary}
        </p>
      )}
      <div className="mt-3">
        <Meta story={story} />
      </div>
    </Link>
  );
}

function RankedRow({ story, rank }: { story: Story; rank: number }) {
  const cat = CATEGORY_META[story.category];
  return (
    <li>
      <Link
        href={`/article/${story.id}`}
        className="group flex gap-3 py-4 first:pt-0"
      >
        <span className="font-display w-5 shrink-0 text-lg font-medium tabular-nums text-slate-600 transition group-hover:text-cyan-300">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display line-clamp-2 font-medium leading-snug text-[#ece8e1] transition group-hover:text-white">
            {story.title}
          </h3>
          <div className="mt-1.5">
            <Meta story={story} />
          </div>
        </div>
        <div className="relative hidden h-16 w-20 shrink-0 overflow-hidden rounded-lg sm:block">
          <StoryImage
            src={story.imageUrl}
            tint={cat.color}
            className="h-full w-full object-cover"
          />
        </div>
      </Link>
    </li>
  );
}

function StripCard({ story, rank }: { story: Story; rank: number }) {
  const cat = CATEGORY_META[story.category];
  return (
    <Link href={`/article/${story.id}`} className="group block">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
        <StoryImage
          src={story.imageUrl}
          tint={cat.color}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07060f]/80 to-transparent" />
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ color: cat.color, background: "rgba(7,6,15,0.7)" }}
        >
          #{rank}
        </span>
      </div>
      <h3 className="font-display mt-2.5 line-clamp-3 text-sm font-medium leading-snug text-[#ece8e1] transition group-hover:text-white">
        {story.title}
      </h3>
      <div className="mt-1.5">
        <Meta story={story} />
      </div>
    </Link>
  );
}
