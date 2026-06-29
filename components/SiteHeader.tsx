"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07060f]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="h-6 w-6 rounded-full"
            style={{
              background: "radial-gradient(circle at 38% 32%, #2563eb, #0b1230)",
              boxShadow: "0 0 12px rgba(34,211,238,0.45)",
            }}
          />
          <span className="font-display text-lg font-medium text-[#ece8e1]">
            Globe<span className="aurora-text italic">News</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link
            href="/following"
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              pathname === "/following"
                ? "border-white/30 text-white"
                : "border-white/[0.12] text-slate-300 hover:border-white/25 hover:text-white"
            }`}
          >
            ♥ Following
          </Link>
          <Link
            href="/for-you"
            className={`aurora-bg rounded-full px-4 py-1.5 text-sm font-medium text-[#07060f] transition ${
              pathname === "/for-you" ? "ring-2 ring-white/40" : "hover:brightness-110"
            }`}
          >
            ✦ For You
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link
            href="/account"
            aria-label="Account"
            className="block h-8 w-8 rounded-full ring-2 ring-white/10"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
          />
        </div>
      </div>
    </header>
  );
}
