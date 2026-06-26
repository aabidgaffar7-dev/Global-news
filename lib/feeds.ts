// The curated "anchor" roster: a deliberately balanced, geographically spread set
// of outlets. Each feed is pinned to a real coordinate so its stories appear as a
// marker on the globe. Adding a new source = one entry here (and later: news APIs
// can push into this same Story shape).

export type Lean =
  | "left"
  | "center-left"
  | "center"
  | "center-right"
  | "right"
  | "intl"; // international / pan-regional outlet

export type Feed = {
  id: string;
  name: string; // the outlet / "anchor"
  url: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  lean: Lean;
};

export const FEEDS: Feed[] = [
  {
    id: "bbc",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    city: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
    lean: "center",
  },
  {
    id: "guardian",
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    city: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
    lean: "center-left",
  },
  {
    id: "npr",
    name: "NPR",
    url: "https://feeds.npr.org/1001/rss.xml",
    city: "Washington, D.C.",
    country: "United States",
    lat: 38.9072,
    lng: -77.0369,
    lean: "center-left",
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    city: "Doha",
    country: "Qatar",
    lat: 25.2854,
    lng: 51.531,
    lean: "intl",
  },
  {
    id: "france24",
    name: "France 24",
    url: "https://www.france24.com/en/rss",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    lean: "center",
  },
  {
    id: "dw",
    name: "Deutsche Welle",
    url: "https://rss.dw.com/rdf/rss-en-all",
    city: "Berlin",
    country: "Germany",
    lat: 52.52,
    lng: 13.405,
    lean: "center",
  },
  {
    id: "globalnews-ca",
    name: "Global News",
    url: "https://globalnews.ca/feed/",
    city: "Toronto",
    country: "Canada",
    lat: 43.6532,
    lng: -79.3832,
    lean: "center",
  },
  {
    id: "abc-au",
    name: "ABC News (Australia)",
    url: "https://www.abc.net.au/news/feed/51120/rss.xml",
    city: "Sydney",
    country: "Australia",
    lat: -33.8688,
    lng: 151.2093,
    lean: "center",
  },
  {
    id: "toi",
    name: "Times of India",
    url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    city: "New Delhi",
    country: "India",
    lat: 28.6139,
    lng: 77.209,
    lean: "center",
  },
  {
    id: "japantimes",
    name: "The Japan Times",
    url: "https://www.japantimes.co.jp/feed/",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    lean: "center",
  },
  {
    id: "toi-israel",
    name: "The Times of Israel",
    url: "https://www.timesofisrael.com/feed/",
    city: "Jerusalem",
    country: "Israel",
    lat: 31.7683,
    lng: 35.2137,
    lean: "center",
  },
  {
    id: "scmp",
    name: "South China Morning Post",
    url: "https://www.scmp.com/rss/91/feed",
    city: "Hong Kong",
    country: "China",
    lat: 22.3193,
    lng: 114.1694,
    lean: "center",
  },
  {
    id: "moscowtimes",
    name: "The Moscow Times",
    url: "https://www.themoscowtimes.com/rss/news",
    city: "Moscow",
    country: "Russia",
    lat: 55.7558,
    lng: 37.6173,
    lean: "intl",
  },
  {
    id: "riotimes",
    name: "The Rio Times",
    url: "https://www.riotimesonline.com/feed/",
    city: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.9068,
    lng: -43.1729,
    lean: "intl",
  },
  {
    id: "allafrica",
    name: "AllAfrica",
    url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf",
    city: "Johannesburg",
    country: "South Africa",
    lat: -26.2041,
    lng: 28.0473,
    lean: "intl",
  },
];

export const LEAN_META: Record<Lean, { label: string; color: string }> = {
  left: { label: "Left", color: "#60a5fa" },
  "center-left": { label: "Center-left", color: "#7dd3fc" },
  center: { label: "Center", color: "#a3a3a3" },
  "center-right": { label: "Center-right", color: "#fca5a5" },
  right: { label: "Right", color: "#f87171" },
  intl: { label: "International", color: "#c084fc" },
};
