// Lightweight keyword categorization so the v0 "Explore by Category" + category
// pages work on real RSS data with no extra feeds. Refine later with outlet
// section feeds if precision matters.

export type Category =
  | "politics"
  | "business"
  | "technology"
  | "entertainment"
  | "health"
  | "sports"
  | "world";

export const CATEGORY_META: Record<
  Category,
  { label: string; description: string; emoji: string; color: string }
> = {
  politics: {
    label: "Politics",
    description: "Latest political developments worldwide",
    emoji: "🏛️",
    color: "#ef4444",
  },
  business: {
    label: "Business",
    description: "Market trends and economic insights",
    emoji: "💼",
    color: "#22c55e",
  },
  technology: {
    label: "Technology",
    description: "Innovation and digital transformation",
    emoji: "⚡",
    color: "#3b82f6",
  },
  entertainment: {
    label: "Entertainment",
    description: "Movies, music, and pop culture",
    emoji: "🎬",
    color: "#a855f7",
  },
  health: {
    label: "Health",
    description: "Medical breakthroughs and wellness",
    emoji: "❤️",
    color: "#ec4899",
  },
  sports: {
    label: "Sports",
    description: "Athletic achievements and competitions",
    emoji: "🏆",
    color: "#f97316",
  },
  world: {
    label: "World",
    description: "Top stories from around the globe",
    emoji: "🌍",
    color: "#0ea5e9",
  },
};

// The 6 category cards shown in "Explore by Category" (world is the fallback bucket).
export const DISPLAY_CATEGORIES: Category[] = [
  "politics",
  "business",
  "technology",
  "entertainment",
  "health",
  "sports",
];

// Ordered so that on a score tie, the more topical / under-populated categories
// (politics, business, entertainment) win over the broad ones (sports, tech).
// All regexes are global so categorize() can count hits, not just detect one.
const KEYWORDS: [Category, RegExp][] = [
  [
    "politics",
    /\b(politic|election|president|parliament|government|vote|senate|minister|congress|policy|diplomat|sanction|war|summit|treaty|coup|protest)\b/gi,
  ],
  [
    "business",
    /\b(business|market|econom|stock|trade|tariff|inflation|bank|finance|revenue|earnings|ceo|merger|investor|gdp|recession|profit)\b/gi,
  ],
  [
    "entertainment",
    /\b(film|movie|music|celebrity|festival|hollywood|actor|actress|singer|concert|album|oscar|grammy|netflix|tv series|pop culture|art gallery|artwork|art exhibition)\b/gi,
  ],
  [
    "health",
    /\b(health|covid|virus|disease|medical|medicine|hospital|vaccine|cancer|ebola|outbreak|mental health|doctor|drug|wellness|pandemic)\b/gi,
  ],
  [
    "sports",
    /\b(sport|football|soccer|cricket|nba|nfl|olympic|fifa|tennis|rugby|golf|league|champions?hip|athlet|esports|world cup|premier league|formula 1|f1)\b/gi,
  ],
  [
    "technology",
    /\b(tech|ai|artificial intelligence|software|chip|semiconductor|google|apple|microsoft|openai|startup|cyber|quantum|robot|smartphone|gadget|app|internet|crypto|bitcoin)\b/gi,
  ],
  // Disasters/humanitarian anchor to World so a stray "golf course turned
  // relief centre" can't drag an earthquake story into Sports.
  [
    "world",
    /\b(earthquake|flood|hurricane|wildfire|eruption|tsunami|landslide|cyclone|typhoon|famine|humanitarian|refugees?|aid workers?|disaster)\b/gi,
  ],
];

// Score each category by keyword hits — headline hits count double (the
// headline says what a story is ABOUT; summaries mention incidental things).
// A single stray hit isn't enough to leave the World bucket: precision
// compounds once thousands of broad-coverage articles flow through this.
export function categorize(title: string, summary = ""): Category {
  let best: Category = "world";
  let bestScore = 0;
  for (const [category, re] of KEYWORDS) {
    const inTitle = (title.match(re) ?? []).length * 2;
    const inSummary = (summary.match(re) ?? []).length;
    const score = inTitle + inSummary;
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }
  return bestScore >= 2 ? best : "world";
}
