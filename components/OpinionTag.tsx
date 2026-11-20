import { isOpinion } from "@/lib/compare";
import type { Story } from "@/lib/news";

// Small "Opinion" pill for story cards and rows, so readers can see which
// pieces the "Hide opinion" filter would remove. Uses the same isOpinion()
// heuristic as the filter. Renders nothing for regular reporting.
export default function OpinionTag({
  story,
}: {
  story: Pick<Story, "link" | "title">;
}) {
  if (!isOpinion(story)) return null;
  return (
    <span
      className="rounded-full border border-amber-300/30 px-1.5 py-0.5 text-amber-200/90"
      title="Looks like an opinion, editorial or analysis piece"
    >
      Opinion
    </span>
  );
}
