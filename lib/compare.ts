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

/**
 * Greedy clustering: a story joins the first cluster it shares at least
 * `minShared` keywords with (from a different outlet). Keeps clusters that
 * span >= `minOutlets` outlets and >= 2 distinct leans.
 */
export function clusterCoverage(
  stories: Story[],
  { minShared = 2, minOutlets = 2, limit = 12 } = {},
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
