// Shared URL helpers used by every ingestion path and the engagement store.

// Only trust http(s) URLs from untrusted feeds — blocks javascript:/data: hrefs.
export function safeHttpUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const proto = new URL(url).protocol;
    return proto === "http:" || proto === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

// Canonical form for comparing/keying article URLs: tracking params and
// scheme/host-case variants must not split the same article's identity
// (dedupe, engagement counts, saved/history joins all key on this).
const TRACKING_PARAM = /^(utm_|fbclid|gclid|mc_cid|mc_eid|cmpid|ref$)/i;

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.protocol = "https:";
    u.hostname = u.hostname.toLowerCase();
    u.hash = "";
    const drop: string[] = [];
    u.searchParams.forEach((_, k) => {
      if (TRACKING_PARAM.test(k)) drop.push(k);
    });
    for (const k of drop) u.searchParams.delete(k);
    let s = u.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  } catch {
    return url;
  }
}

// Truncate at a word boundary and add an ellipsis only when actually cut —
// never leave a summary chopped mid-word.
export function truncate(s: string | undefined, max = 220): string | undefined {
  if (!s) return undefined;
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

// Undated items get a stable, penalized timestamp: assigned once (so they age
// normally instead of reading "just now" forever) and treated as a day old
// (so they can't outrank genuinely fresh stories on perfect recency).
const firstSeen = new Map<string, string>();
export function stablePublishedAt(
  raw: string | undefined,
  link: string,
): string {
  const parsed = new Date(raw ?? "");
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  let assigned = firstSeen.get(link);
  if (!assigned) {
    assigned = new Date(Date.now() - 24 * 3_600_000).toISOString();
    if (firstSeen.size > 5000) firstSeen.clear(); // bounded memory
    firstSeen.set(link, assigned);
  }
  return assigned;
}
