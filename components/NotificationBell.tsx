"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LEAN_META, type Lean } from "@/lib/feeds";
import { timeAgo } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  source: string;
  lean: Lean;
  publishedAt: string;
};

const SEEN_KEY = "gn_last_seen";

export default function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = Number(localStorage.getItem(SEEN_KEY) ?? 0);
    // First visit: baseline to "now" so we don't flood a newcomer with unread.
    if (!stored) localStorage.setItem(SEEN_KEY, String(Date.now()));
    setLastSeen(stored || Date.now());
    fetch("/api/recent")
      .then((r) => r.json())
      .then((d) => setItems(d.stories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread =
    lastSeen === null
      ? 0
      : items.filter((s) => new Date(s.publishedAt).getTime() > lastSeen).length;

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next) {
        const now = Date.now();
        localStorage.setItem(SEEN_KEY, String(now));
        setLastSeen(now);
      }
      return next;
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
        className="relative flex text-slate-400 transition hover:text-white"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-1 text-[10px] font-bold text-[#07060f]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0a16]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="text-sm font-medium text-slate-200">
              Latest stories
            </span>
            {unread > 0 && (
              <span className="text-[11px] text-cyan-300">{unread} new</span>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                Catching the wire…
              </li>
            ) : (
              items.slice(0, 12).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/article/${s.id}`}
                    onClick={() => setOpen(false)}
                    className="flex gap-2 px-4 py-2.5 transition hover:bg-white/5"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: LEAN_META[s.lean].color }}
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm text-slate-200">
                        {s.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {s.source} · {timeAgo(s.publishedAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/popular"
            onClick={() => setOpen(false)}
            className="block border-t border-white/10 px-4 py-2.5 text-center text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            See all trending →
          </Link>
        </div>
      )}
    </div>
  );
}
