"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Poll } from "@/lib/community";

const BAR = ["#22d3ee", "#a78bfa", "#ec4899", "#f59e0b", "#34d399", "#60a5fa"];

// A poll is the purest form of this site's thesis: the readers themselves
// generating the data. Results stay hidden until you vote, then animate in as
// a bar chart so the crowd's shape is the payoff.
export default function PollCard({
  poll,
  userId,
}: {
  poll: Poll;
  userId: string | null;
}) {
  const [counts, setCounts] = useState(poll.counts);
  const [myVote, setMyVote] = useState<number | null>(poll.myVote);
  const [busy, setBusy] = useState(false);
  const total = counts.reduce((a, b) => a + b, 0);
  const revealed = myVote !== null;

  async function vote(idx: number) {
    if (busy || !userId) return;
    setBusy(true);
    const prevCounts = counts;
    const prevVote = myVote;
    const next = [...counts];
    if (prevVote !== null && next[prevVote] > 0) next[prevVote]--;
    next[idx]++;
    setCounts(next);
    setMyVote(idx);

    const { error } = await getBrowserSupabase()
      .from("poll_votes")
      .upsert(
        { poll_id: poll.id, user_id: userId, option_index: idx },
        { onConflict: "poll_id,user_id" },
      );
    if (error) {
      setCounts(prevCounts);
      setMyVote(prevVote);
    }
    setBusy(false);
  }

  return (
    <article className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-300/80">
        <Icon name="chart" size={13} />
        Reader poll
      </div>
      <h3 className="font-display mt-2 text-lg font-medium leading-snug text-[#ece8e1]">
        {poll.question}
      </h3>

      <ul className="mt-4 space-y-2">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
          const mine = myVote === i;
          const color = BAR[i % BAR.length];
          return (
            <li key={opt}>
              {revealed ? (
                <div
                  className="relative overflow-hidden rounded-xl border px-3 py-2.5"
                  style={{
                    borderColor: mine ? `${color}80` : "rgba(255,255,255,0.10)",
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%`, background: `${color}26` }}
                    aria-hidden
                  />
                  <div className="relative flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      {mine && (
                        <Icon name="check" size={13} style={{ color }} />
                      )}
                      {opt}
                    </span>
                    <span
                      className="shrink-0 font-semibold tabular-nums"
                      style={{ color }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              ) : userId ? (
                <button
                  onClick={() => vote(i)}
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.07] disabled:opacity-50"
                >
                  {opt}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 transition hover:border-cyan-400/40"
                >
                  {opt}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-slate-500">
        {total} {total === 1 ? "vote" : "votes"}
        {!userId && " · sign in to vote and see results"}
        {revealed && " · you can change your answer any time"}
      </p>
    </article>
  );
}
