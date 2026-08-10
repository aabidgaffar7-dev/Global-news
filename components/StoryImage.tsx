"use client";

import { useState } from "react";

// Untrusted feed image URLs pass scheme validation but can still 404 or be
// hotlink-blocked. Two defenses:
//  1. referrerPolicy="no-referrer" — many outlets' CDNs reject requests that
//     carry a foreign Referer header, which was silently blanking a large
//     share of otherwise-valid images.
//  2. an on-brand gradient placeholder (not a lone emoji, which rendered as a
//     grey pill and read as "broken") when there's no image or it fails.
export default function StoryImage({
  src,
  className,
  fallbackClassName,
  tint,
}: {
  src?: string;
  className?: string;
  fallbackClassName?: string;
  /** category colour, used to tint the placeholder so it looks intentional */
  tint?: string;
}) {
  const [failed, setFailed] = useState(false);
  const accent = tint ?? "#22d3ee";

  if (!src || failed) {
    return (
      <div
        className={
          fallbackClassName ??
          "relative flex h-full w-full items-center justify-center overflow-hidden"
        }
        style={{
          background: `radial-gradient(120% 100% at 20% 0%, ${accent}22, transparent 60%), linear-gradient(135deg, #0d1024, #07060f)`,
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={accent}
          strokeWidth="1.1"
          className="h-8 w-8 opacity-50"
        >
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3.5 9h17M3.5 15h17" />
        </svg>
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
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
