"use client";

import { getSupabase } from "@/lib/supabase";

// A click-through to the source is the strongest "this story mattered to me"
// signal — record it (fire-and-forget) without ever blocking navigation.
export default function ReadSourceButton({
  link,
  title,
  source,
}: {
  link: string;
  title: string;
  source: string;
}) {
  function trackClick() {
    const sb = getSupabase();
    if (!sb) return;
    sb.rpc("increment_engagement", {
      p_link: link,
      p_title: title,
      p_source: source,
      p_kind: "click",
    }).then(
      () => {},
      () => {},
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-400"
    >
      Read the full article at {source} ↗
    </a>
  );
}
