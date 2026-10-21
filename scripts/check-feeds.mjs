// Reachability check for every feed in lib/feeds.ts (the real roster, so this
// can't drift from the app). Run: node scripts/check-feeds.mjs
// Needs Node 22.18+ (imports the .ts file directly) and open internet access.
import { FEEDS } from "../lib/feeds.ts";

const UA = "Mozilla/5.0 (compatible; GlobeNewsBot/0.1)";

const results = await Promise.all(
  FEEDS.map(async ({ name, url }) => {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10000) });
      const text = await res.text();
      const items = (text.match(/<item[\s>]|<entry[\s>]/g) || []).length;
      return { ok: res.ok && items > 0, line: `${res.ok ? "OK " : "BAD"} ${res.status}  items=${String(items).padEnd(3)}  ${name}` };
    } catch (e) {
      return { ok: false, net: true, line: `ERR ---  items=0    ${name}  (${e.name}: ${e.message})` };
    }
  }),
);

for (const r of results) console.log(r.line);
const bad = results.filter((r) => !r.ok).length;
if (results.every((r) => r.net)) console.log("\nEvery request failed at the network level: this machine probably has no outbound access, so the feeds are untested.");
else console.log(`\n${results.length - bad}/${results.length} feeds healthy`);
process.exitCode = bad ? 1 : 0;
