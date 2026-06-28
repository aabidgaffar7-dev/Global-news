"use client";

import { useState } from "react";

// Shares the in-app /article/[id] URL so recipients land on the neutral
// summary, not straight on the source. Uses the native share sheet when
// available, with a copy-link fallback.
export default function ShareButton({
  title,
  path,
}: {
  title: string;
  path: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing else to do
    }
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
    >
      {copied ? (
        <>Link copied ✓</>
      ) : (
        <>
          <span aria-hidden>↗</span> Share
        </>
      )}
    </button>
  );
}
