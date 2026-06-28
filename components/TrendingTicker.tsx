import Link from "next/link";
import { LEAN_META } from "@/lib/feeds";
import { formatCount } from "@/lib/format";
import type { Story } from "@/lib/news";

// A gently auto-scrolling stream of current top headlines — the first "this is
// live, click me" hook a visitor sees. Pure CSS marquee; pauses on hover.
export default function TrendingTicker({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null;
  const loop = [...stories, ...stories]; // duplicated for a seamless wrap

  return (
    <div className="border-b border-white/10 bg-white/[0.02] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5">
        <Link
          href="/popular"
          className="flex shrink-0 items-center gap-1.5 py-2.5 pr-1 text-[11px] font-medium uppercase tracking-wider text-cyan-300 transition hover:text-cyan-200"
        >
          <span className="pulse-dot h-2 w-2 rounded-full bg-cyan-400" />
          Trending
        </Link>
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)",
          }}
        >
          <div className="ticker-track flex w-max items-center gap-8 py-2.5">
            {loop.map((s, i) => (
              <Link
                key={`${s.id}-${i}`}
                href={`/article/${s.id}`}
                className="group flex shrink-0 items-center gap-2 text-sm text-slate-300 transition hover:text-white"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: LEAN_META[s.lean].color }}
                />
                <span className="whitespace-nowrap">{s.title}</span>
                <span className="whitespace-nowrap text-xs text-slate-500">
                  · {s.source}
                  {s.views ? ` · 👁 ${formatCount(s.views)}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
