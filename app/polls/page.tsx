import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import PollCard from "@/components/PollCard";
import Icon from "@/components/Icon";
import { getPolls } from "@/lib/community";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reader Polls",
  description:
    "Where GlobeNews readers stand — vote and watch the results move in real time.",
};

export default async function PollsPage() {
  const { polls, userId } = await getPolls(20);

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <header className="mt-6 border-b border-white/10 pb-5">
          <h1 className="font-display text-3xl font-medium text-[#ece8e1] sm:text-4xl">
            Reader <span className="aurora-text italic">polls</span>
          </h1>
          <p className="mt-2 max-w-xl text-slate-400">
            This site is built on what people actually think. Cast a vote and
            watch where everyone else landed.
          </p>
        </header>

        {polls.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center">
            <Icon
              name="chart"
              size={22}
              className="mx-auto mb-3 text-cyan-300/70"
            />
            <p className="text-slate-300">Polls are warming up.</p>
            <p className="mt-1 text-sm text-slate-500">
              Once the community tables are live, reader polls appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {polls.map((p) => (
              <PollCard key={p.id} poll={p} userId={userId} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
