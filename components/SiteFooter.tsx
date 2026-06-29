import Link from "next/link";
import { BRAND_TAGLINE } from "@/lib/brand";

const LINKS: [string, string][] = [
  ["Home", "/"],
  ["Most Popular", "/popular"],
  ["Following", "/following"],
  ["For You", "/for-you"],
  ["Saved", "/saved"],
  ["About & Methodology", "/about"],
  ["Account", "/account"],
];

export default function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-sm">
            <div className="font-display text-lg font-medium text-[#ece8e1]">
              Globe<span className="aurora-text italic">News</span>
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              {BRAND_TAGLINE}. Ranked by readers, summarized neutrally, sourced
              transparently.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-sm">
            {LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-slate-400 transition hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 border-t border-white/5 pt-5 text-xs text-slate-600">
          © GlobeNews · Neutral by design — the crowd decides what rises.
        </div>
      </div>
    </footer>
  );
}
