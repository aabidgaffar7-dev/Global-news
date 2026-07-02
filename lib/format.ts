export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

// What a surface may honestly SAY about a story's location, based on how the
// coords were derived. 'city' → the detected city; 'country' → country only;
// 'source' (outlet HQ) → nothing: never present the outlet's home as the
// story's location.
export function storyPlace(s: {
  placement: "city" | "country" | "source";
  city: string;
  country: string;
}): string | null {
  if (s.placement === "city") return s.city;
  if (s.placement === "country") return s.country;
  return null;
}

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
