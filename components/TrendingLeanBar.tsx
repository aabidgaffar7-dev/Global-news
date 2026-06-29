import { LEAN_META, type Lean } from "@/lib/feeds";

const ORDER: Lean[] = [
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "intl",
];

// The political-lean spread of what's currently trending — the neutrality
// mission, quantified honestly from real data (no fabricated score).
export default function TrendingLeanBar({ leans }: { leans: Lean[] }) {
  const total = leans.length;
  if (total === 0) return null;
  const counts = new Map<Lean, number>();
  for (const l of leans) counts.set(l, (counts.get(l) ?? 0) + 1);
  const bands = ORDER.map((l) => ({ l, c: counts.get(l) ?? 0 }));

  return (
    <div className="glass mx-auto mt-8 max-w-2xl rounded-2xl px-5 py-4 text-left">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Today&apos;s trending mix
        </span>
        <span className="text-xs text-slate-500">
          across {total} top stories
        </span>
      </div>
      <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-white/5">
        {bands.map((b) => (
          <div
            key={b.l}
            title={`${LEAN_META[b.l].label} · ${b.c}`}
            style={{
              flexGrow: b.c,
              minWidth: b.c ? undefined : 0,
              background: LEAN_META[b.l].color,
            }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {bands
          .filter((b) => b.c > 0)
          .map((b) => (
            <span
              key={b.l}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: LEAN_META[b.l].color }}
              />
              {LEAN_META[b.l].label} · {Math.round((b.c / total) * 100)}%
            </span>
          ))}
      </div>
    </div>
  );
}
