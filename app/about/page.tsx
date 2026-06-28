import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { LEAN_META, FEEDS, type Lean } from "@/lib/feeds";

export const metadata: Metadata = {
  title: "About & Methodology",
  description:
    "How GlobeNews works: stories ranked by what readers actually open, sources labelled by political lean, and neutral AI summaries that link to the original.",
};

const LEAN_ORDER: Lean[] = [
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "intl",
];

const PRINCIPLES = [
  {
    icon: "👥",
    title: "Ranked by readers, not editors",
    body: "There's no editorial algorithm deciding what you see first. Stories rise on what people actually open and read. As real reading data accumulates, the crowd's attention — not ours — sets the order. Trusted, professional outlets get read more, rise, and get shown to more people.",
  },
  {
    icon: "🏷️",
    title: "Transparent about lean",
    body: "Every source wears a political-lean label, so you always know the vantage point you're reading from. We don't hide it or pretend a single outlet is 'the' neutral truth — neutrality comes from seeing the spread, not from trusting one voice.",
  },
  {
    icon: "✨",
    title: "Neutral AI summaries",
    body: "Each story gets a concise, factual AI summary with the key points — written to inform, not persuade — and a prominent link to read the full piece in the outlet's own words. Understand fast, then go to the source.",
  },
  {
    icon: "🌍",
    title: "A deliberately balanced roster",
    body: `Our ${FEEDS.length} curated outlets are spread across the globe and the spectrum — from London to Doha, Tokyo to Johannesburg — so the popularity contest happens on a level, international field.`,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <header className="mt-8 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
            How it works
          </div>
          <h1 className="font-display mt-3 text-4xl font-medium text-[#ece8e1] sm:text-5xl">
            The crowd decides{" "}
            <span className="aurora-text italic">what rises</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-slate-400">
            GlobeNews is built on one idea: when people freely choose what to
            read, credible and professional outlets naturally rise to the top —
            and the rest of us benefit from that collective judgment.
          </p>
        </header>

        <div className="mt-12 space-y-4">
          {PRINCIPLES.map((p) => (
            <section key={p.title} className="glass rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl" aria-hidden>
                  {p.icon}
                </span>
                <div>
                  <h2 className="font-display text-xl font-medium text-[#ece8e1]">
                    {p.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {p.body}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Lean legend */}
        <section className="glass mt-4 rounded-2xl p-6">
          <h2 className="font-display text-xl font-medium text-[#ece8e1]">
            The lean labels
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            You&apos;ll see one of these on every source. They describe the
            outlet&apos;s typical vantage point — an estimate to read with, not a
            verdict.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {LEAN_ORDER.map((lean) => (
              <span
                key={lean}
                className="rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  color: LEAN_META[lean].color,
                  background: `${LEAN_META[lean].color}1a`,
                }}
              >
                {LEAN_META[lean].label}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/popular"
            className="aurora-bg inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
          >
            See what&apos;s trending now →
          </Link>
        </div>
      </main>
    </div>
  );
}
