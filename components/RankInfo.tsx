"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Honest, non-fabricated explainer of how ordering works — the mission,
// surfaced right where people would ask "why is this ranked here?".
export default function RankInfo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="How ranking works"
        className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/[0.06]"
      >
        ⓘ How it&apos;s ranked
      </button>
      {open && (
        <div className="absolute left-1/2 top-9 z-50 w-72 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0b0a16]/95 p-4 text-left text-xs leading-relaxed text-slate-300 shadow-2xl backdrop-blur-xl">
          <p className="font-medium text-slate-100">No editor picks these.</p>
          <p className="mt-2">Order comes from a blend of:</p>
          <ul className="mt-1.5 space-y-1">
            <li>
              <span className="text-cyan-300">•</span> how <b>recent</b> a story
              is
            </li>
            <li>
              <span className="text-violet-300">•</span> the outlet&apos;s{" "}
              <b>prominence</b>
            </li>
            <li>
              <span className="text-pink-300">•</span> and — increasingly — how
              many <b>people are reading</b> it
            </li>
          </ul>
          <p className="mt-2">
            As real reader data grows, the crowd&apos;s attention takes over.{" "}
            <Link href="/about" className="aurora-text">
              More →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
