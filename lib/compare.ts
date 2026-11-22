// Groups stories that cover the same event across outlets so readers can
// compare how different vantage points headline it. Pure: no I/O.
import type { Lean } from "./feeds";
import type { Story } from "./news";

export type CoverageCluster = {
  id: string;
  keywords: string[]; // shared words that tie the cluster together
  stories: Story[]; // one per outlet, highest score first
  leans: Lean[]; // distinct leans represented
  score: number; // sum of story scores, used to rank clusters
};

const STOP = new Set(
  (
    "a about after again all also amid an and are as at be been before being " +
    "but by can could day did do does for from get got had has have he her his " +
    "how if in into is it its just may more most new news no not now of off on " +
    "one only or our out over says say said she so than that the their them " +
    "then there these they this to up us was we were what when where which " +
    "while who why will with would year years you your live latest report " +
    "reports video watch"
  ).split(" "),
);

export function topicKeywords(title: string): Set<string> {
  const out = new Set<string>();
  for (const w of title.toLowerCase().replace(/['’]s\b/g, "").split(/[^a-z0-9]+/)) {
    if (w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)) out.add(w);
  }
  return out;
}

function shared(a: Set<string>, b: Set<string>): string[] {
  const hits: string[] = [];
  for (const w of a) if (b.has(w)) hits.push(w);
  return hits;
}

/** Default clustering thresholds; also shown to readers on /compare. */
export const CLUSTER_DEFAULTS: { minShared: number; minOutlets: number; limit: number } = {
  minShared: 2,
  minOutlets: 2,
  limit: 12,
};

/**
 * Greedy clustering: a story joins the first cluster it shares at least
 * `minShared` keywords with (from a different outlet). Keeps clusters that
 * span >= `minOutlets` outlets and >= 2 distinct leans.
 */
export function clusterCoverage(
  stories: Story[],
  {
    minShared = CLUSTER_DEFAULTS.minShared,
    minOutlets = CLUSTER_DEFAULTS.minOutlets,
    limit = CLUSTER_DEFAULTS.limit,
  } = {},
): CoverageCluster[] {
  type Work = { kw: Set<string>; stories: Story[] };
  const clusters: Work[] = [];

  const sorted = [...stories].sort((a, b) => b.score - a.score);
  for (const s of sorted) {
    const kw = topicKeywords(s.title);
    if (kw.size < minShared) continue;
    const home = clusters.find(
      (c) =>
        shared(kw, c.kw).length >= minShared &&
        !c.stories.some((x) => x.sourceId === s.sourceId),
    );
    if (home) {
      home.stories.push(s);
      for (const w of kw) home.kw.add(w);
    } else {
      clusters.push({ kw, stories: [s] });
    }
  }

  return clusters
    .filter((c) => c.stories.length >= minOutlets)
    .map((c) => {
      const leans = [...new Set(c.stories.map((s) => s.lean))];
      const counts = new Map<string, number>();
      for (const s of c.stories)
        for (const w of topicKeywords(s.title)) counts.set(w, (counts.get(w) ?? 0) + 1);
      const keywords = [...counts.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([w]) => w);
      return {
        id: c.stories[0].id,
        keywords,
        stories: c.stories,
        leans,
        score: c.stories.reduce((t, s) => t + s.score, 0),
      };
    })
    .filter((c) => c.leans.length >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Why each story is in its cluster: the headline keywords it shares with at
 * least one other story in the same cluster. Same order as `cluster.stories`.
 */
export function clusterLinks(
  cluster: CoverageCluster,
): { story: Story; words: string[] }[] {
  const kws = cluster.stories.map((s) => topicKeywords(s.title));
  return cluster.stories.map((story, i) => ({
    story,
    words: [...kws[i]]
      .filter((w) => kws.some((other, j) => j !== i && other.has(w)))
      .sort(),
  }));
}

/**
 * For each lean in a cluster, the headline words only that lean's outlets
 * used (not any other lean's), minus the words that define the cluster.
 * Shows how framing differs. Empty array for a lean means no unique words.
 */
export function leanWordDiff(
  cluster: CoverageCluster,
  perLean = 3,
): { lean: Lean; words: string[] }[] {
  const byLean = new Map<Lean, Map<string, number>>();
  for (const s of cluster.stories) {
    const m = byLean.get(s.lean) ?? new Map<string, number>();
    for (const w of topicKeywords(s.title)) m.set(w, (m.get(w) ?? 0) + 1);
    byLean.set(s.lean, m);
  }
  const skip = new Set(cluster.keywords);
  return [...byLean.entries()].map(([lean, words]) => {
    const unique = [...words.entries()]
      .filter(
        ([w]) =>
          !skip.has(w) &&
          ![...byLean.entries()].some(([l, m]) => l !== lean && m.has(w)),
      )
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, perLean)
      .map(([w]) => w);
    return { lean, words: unique };
  });
}

/**
 * Words that many different outlets are headlining right now, for a
 * "Trending topics" chip row. Counts each word once per outlet.
 */
export function trendingTopics(
  stories: Story[],
  { limit = 8, minOutlets = 3, window = 80 } = {},
): { word: string; outlets: number }[] {
  const byWord = new Map<string, Set<string>>();
  for (const s of stories.slice(0, window)) {
    for (const w of topicKeywords(s.title)) {
      const set = byWord.get(w) ?? new Set<string>();
      set.add(s.sourceId);
      byWord.set(w, set);
    }
  }
  return [...byWord.entries()]
    .filter(([, o]) => o.size >= minOutlets)
    .map(([word, o]) => ({ word, outlets: o.size }))
    .sort((a, b) => b.outlets - a.outlets || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/** Heuristic: does this story look like an opinion/editorial piece? */
export function isOpinion(s: Pick<Story, "link" | "title">): boolean {
  if (/\/(opinions?|editorials?|commentary|columns?|op-ed|analysis-and-opinion)\//i.test(s.link))
    return true;
  return /^(opinion|editorial|comment|column|op-ed|analysis)\s*[:|–—-]/i.test(s.title.trim());
}

/**
 * Words that most often appear in headlines alongside `word`, for a
 * "Related topics" chip row. Counts each word once per story.
 */
export function relatedTopics(
  stories: Story[],
  word: string,
  { limit = 8, minStories = 2 } = {},
): { word: string; stories: number }[] {
  const counts = new Map<string, number>();
  for (const s of stories) {
    const kw = topicKeywords(s.title);
    if (!kw.has(word)) continue;
    for (const w of kw) if (w !== word) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= minStories)
    .map(([w, n]) => ({ word: w, stories: n }))
    .sort((a, b) => b.stories - a.stories || a.word.localeCompare(b.word))
    .slice(0, limit);
}
