import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
        <div className="font-display aurora-text text-7xl font-medium">404</div>
        <h1 className="font-display mt-4 text-2xl font-medium text-[#ece8e1]">
          This story drifted off the map
        </h1>
        <p className="mt-2 text-slate-400">
          The page you&apos;re looking for isn&apos;t here — top stories rotate
          every 10 minutes, so it may have moved on.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="aurora-bg rounded-full px-5 py-2.5 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
          >
            ← Back to the globe
          </Link>
          <Link
            href="/popular"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.05]"
          >
            See what&apos;s trending
          </Link>
        </div>
      </main>
    </div>
  );
}
