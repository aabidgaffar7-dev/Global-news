"use client";

import { useState } from "react";

// Untrusted feed image URLs pass scheme validation but can still 404 or be
// hotlink-blocked. Swap to the 🗞️ placeholder on load failure instead of
// leaving a broken-image box.
export default function StoryImage({
  src,
  className,
  fallbackClassName,
}: {
  src?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const fallback =
    fallbackClassName ??
    "flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-3xl";

  if (!src || failed) {
    return (
      <div className={fallback} aria-hidden>
        🗞️
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
