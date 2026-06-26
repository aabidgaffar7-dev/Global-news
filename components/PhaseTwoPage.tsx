import Link from "next/link";
import SiteHeader from "./SiteHeader";

export default function PhaseTwoPage({
  emoji,
  title,
  tagline,
  features,
}: {
  emoji: string;
  title: string;
  tagline: string;
  features: string[];
}) {
  return (
    <div className="min-h-screen bg-[#03040a] text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <div className="text-5xl" aria-hidden>
            {emoji}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-slate-400">{tagline}</p>

          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm text-amber-200">
            Phase 2 · unlocks with your account
          </div>

          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-slate-400">
            {features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-sky-400">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
