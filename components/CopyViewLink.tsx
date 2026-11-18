"use client";

import { useState } from "react";

// Copies the current page URL, filters included (sort/region/lean live in the
// query string), so a reader can hand someone the exact view they're looking
// at. The hash is dropped so the link opens at the top of the page.
export default function CopyViewLink() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const url = window.location.href.split("#")[0];
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy a link that opens this page with the same filters"
      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/[0.07]"
    >
      <span aria-live="polite">
        {state === "copied"
          ? "Link copied ✓"
          : state === "failed"
            ? "Couldn't copy, use the address bar"
            : "🔗 Copy link to this view"}
      </span>
    </button>
  );
}
