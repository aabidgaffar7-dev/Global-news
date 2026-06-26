"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#03040a]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Global News Hub
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          <Link
            href="/following"
            className={`rounded-full bg-gradient-to-r from-rose-600/40 to-rose-500/20 px-4 py-1.5 text-sm font-medium text-rose-200 transition hover:text-white ${
              pathname === "/following" ? "ring-1 ring-rose-400/60" : ""
            }`}
          >
            ♥ Following
          </Link>
          <Link
            href="/for-you"
            className={`rounded-full bg-gradient-to-r from-amber-500/40 to-yellow-500/20 px-4 py-1.5 text-sm font-medium text-amber-200 transition hover:text-white ${
              pathname === "/for-you" ? "ring-1 ring-amber-400/60" : ""
            }`}
          >
            ✦ For You
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-lg text-slate-400" aria-hidden>
            🔔
          </span>
          <Link
            href="/account"
            aria-label="Account"
            className="block h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 ring-2 ring-white/10"
          />
        </div>
      </div>
    </header>
  );
}
