"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LEAN_META, type Lean } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  source: string;
  lean: Lean;
  publishedAt: string;
  match?: string;
};

// Signed-in readers get their follow-matched stories right on the homepage —
// the daily-return loop shouldn't start cold. Fetched client-side (the API
// reads the session cookie) so the home page itself stays cacheable; renders
// nothing for anonymous visitors or readers with no matches.
export default function YourWireStrip() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/recent")
      .then((r) => r.json())
      .then((d) => {
        if (d?.personalized)
          setItems(
            (d.stories as Item[]).filter((s) => s.match).slice(0, 3),
          );
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="glass mt-6 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan-400" />
          From your follows
        </h2>
        <Link
          href="/following"
          className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
        >
          Your wire →
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-white/5">
        {items.map((s) => (
          <li key={s.id}>
            <Link
              href={`/article/${s.id}`}
              className="group flex items-baseline gap-2 py-2"
            >
              {s.match && (
                <span className="shrink-0 rounded-full bg-cyan-400/10 px-1.5 py-px text-[11px] font-medium text-cyan-300">
                  {s.match}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200 group-hover:text-white">
                {s.title}
              </span>
              <span className="shrink-0 text-[11px] text-slate-500">
                <span style={{ color: LEAN_META[s.lean]?.color }}>
                  {s.source}
                </span>{" "}
                · {timeAgo(s.publishedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
