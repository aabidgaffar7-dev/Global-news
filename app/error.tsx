"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen text-slate-200">
      <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
        <div className="font-display aurora-text text-6xl font-medium">Oops</div>
        <h1 className="font-display mt-4 text-2xl font-medium text-[#ece8e1]">
          Something went sideways
        </h1>
        <p className="mt-2 text-slate-400">
          A news feed may be slow or temporarily unavailable. Give it a moment
          and try again.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="aurora-bg rounded-full px-5 py-2.5 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.05]"
          >
            Back home
          </Link>
        </div>
      </main>
    </div>
  );
}
