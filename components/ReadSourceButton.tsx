"use client";

// A click-through to the source is the strongest "this story mattered to me"
// signal — record it once per session (fire-and-forget, never blocks
// navigation) through the validated /api/engage beacon.
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
    const key = `gn_clicked:${link}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked — record anyway
    }
    fetch("/api/engage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ link, title, source, kind: "click" }),
      keepalive: true, // survives the tab navigating away
    }).catch(() => {});
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      className="aurora-bg mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-[#07060f] transition hover:brightness-110"
    >
      Read the full article at {source} ↗
    </a>
  );
}
