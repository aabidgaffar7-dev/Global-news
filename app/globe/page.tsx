import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import GlobeExplorer from "@/components/GlobeExplorer";
import Icon from "@/components/Icon";
import { getAllStories, globeLocations } from "@/lib/news";

export const revalidate = 600;

export const metadata = {
  title: "The Globe",
  description:
    "Spin the Earth and drop into any city's top stories — every story GlobeNews tracks, plotted where it actually happened.",
};

export default async function GlobePage() {
  const stories = await getAllStories();
  const locations = globeLocations(stories);
  const active = locations.filter((l) => l.storyCount > 0);
  const countries = new Set(active.map((l) => l.country)).size;

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-white/10 pb-5">
          <div>
            <h1 className="font-display text-3xl font-medium text-[#ece8e1] sm:text-4xl">
              The <span className="aurora-text italic">Globe</span>
            </h1>
            <p className="mt-2 max-w-xl text-slate-400">
              Every story we track, plotted where it actually happened. Pick a
              city from the list or spin the Earth and dive in.
            </p>
          </div>
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Cities live
              </dt>
              <dd className="font-display text-2xl font-medium text-cyan-300">
                {active.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Countries
              </dt>
              <dd className="font-display text-2xl font-medium text-violet-300">
                {countries}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Stories
              </dt>
              <dd className="font-display text-2xl font-medium text-pink-300">
                {stories.length}
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-6">
          <GlobeExplorer locations={locations} />
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Icon name="info" size={13} />
          Stories are placed by the city their headline names; when only a
          country is known we plot its main hub.
        </p>
      </main>
    </div>
  );
}
