// Throwaway reachability check for the curated feeds. Run: node scripts/check-feeds.mjs
const feeds = [
  ["BBC News", "https://feeds.bbci.co.uk/news/world/rss.xml"],
  ["The Guardian", "https://www.theguardian.com/world/rss"],
  ["NPR", "https://feeds.npr.org/1001/rss.xml"],
  ["Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"],
  ["France 24", "https://www.france24.com/en/rss"],
  ["Deutsche Welle", "https://rss.dw.com/rdf/rss-en-all"],
  ["CBC News", "https://www.cbc.ca/webfeed/rss/rss-topstories"],
  ["ABC News (AU)", "https://www.abc.net.au/news/feed/51120/rss.xml"],
  ["Times of India", "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"],
  ["The Japan Times", "https://www.japantimes.co.jp/feed/"],
  ["The Times of Israel", "https://www.timesofisrael.com/feed/"],
  ["South China Morning Post", "https://www.scmp.com/rss/91/feed"],
  ["The Moscow Times", "https://www.themoscowtimes.com/rss/news"],
  ["The Rio Times", "https://www.riotimesonline.com/feed/"],
  ["AllAfrica", "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf"],
];

const UA = "Mozilla/5.0 (compatible; GlobeNewsBot/0.1)";

for (const [name, url] of feeds) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    const items = (text.match(/<item[\s>]|<entry[\s>]/g) || []).length;
    console.log(`${res.ok ? "OK " : "BAD"} ${res.status}  items=${String(items).padEnd(3)}  ${name}`);
  } catch (e) {
    console.log(`ERR ---  items=0    ${name}  (${e.name}: ${e.message})`);
  }
}
