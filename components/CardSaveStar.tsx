"use client";

import SaveButton from "@/components/SaveButton";
import { markSaved, useSavedLinks } from "@/lib/saved-client";
import type { Story } from "@/lib/news";

// Compact "☆ Save" star for story cards on cached pages (home, category,
// topic, outlet). Renders nothing until the reader's saved links have loaded
// (one shared query per page), so it never flashes the wrong state. Place it
// OUTSIDE the card's <Link> so tapping it doesn't open the article.
export default function CardSaveStar({
  story,
  className = "",
}: {
  story: Story;
  /** Positioning classes for the pill. */
  className?: string;
}) {
  const saved = useSavedLinks();
  if (!saved) return null;
  return (
    <div
      className={`rounded-full bg-[#07060f]/75 px-2 py-0.5 text-[11px] backdrop-blur ${className}`}
    >
      <SaveButton
        // Remount on sign-in/out so the star starts from the right state.
        key={saved.userId ?? "anon"}
        compact
        refresh={false}
        onChange={(on) => markSaved(story.link, on)}
        userId={saved.userId}
        initialSaved={saved.links.has(story.link)}
        story={{
          storyId: story.id,
          link: story.link,
          title: story.title,
          source: story.source,
          category: story.category,
          imageUrl: story.imageUrl,
        }}
      />
    </div>
  );
}
