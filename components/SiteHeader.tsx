"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { CATEGORY_META, DISPLAY_CATEGORIES } from "@/lib/categories";

export default function SiteHeader() {
  const pathname = usePathname();
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const topicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topicsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (topicsRef.current && !topicsRef.current.contains(e.target as Node))
        setTopicsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [topicsOpen]);

  // Close everything on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setTopicsOpen(false);
  }, [pathname]);

  const active = (href: string) => pathname === href;
  const link = (isActive: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition ${
      isActive ? "text-white" : "text-slate-300 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07060f]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-5">
        {/* Left: logo + desktop nav */}
        <div className="flex items-center gap-1">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              className="h-6 w-6 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 38% 32%, #2563eb, #0b1230)",
                boxShadow: "0 0 12px rgba(34,211,238,0.45)",
              }}
            />
            <span className="font-display text-lg font-medium text-[#ece8e1]">
              Globe<span className="aurora-text italic">News</span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center md:flex">
            <Link href="/popular" className={link(active("/popular"))}>
              Popular
            </Link>

            <div ref={topicsRef} className="relative">
              <button
                onClick={() => setTopicsOpen((o) => !o)}
                className={link(pathname.startsWith("/category"))}
              >
                Topics <span className="text-[10px]">▾</span>
              </button>
              {topicsOpen && (
                <div className="absolute left-0 top-9 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0a16]/95 p-1.5 shadow-2xl backdrop-blur-xl">
                  {DISPLAY_CATEGORIES.map((c) => (
                    <Link
                      key={c}
                      href={`/category/${c}`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                    >
                      <span style={{ color: CATEGORY_META[c].color }}>
                        {CATEGORY_META[c].emoji}
                      </span>
                      {CATEGORY_META[c].label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/following" className={link(active("/following"))}>
              Following
            </Link>
            <Link
              href="/for-you"
              className={`aurora-bg ml-1 rounded-full px-3.5 py-1.5 text-sm font-medium text-[#07060f] transition ${
                active("/for-you") ? "ring-2 ring-white/40" : "hover:brightness-110"
              }`}
            >
              ✦ For You
            </Link>
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className="text-slate-400 transition hover:text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <NotificationBell />
          <Link
            href="/account"
            aria-label="Account"
            className="block h-8 w-8 shrink-0 rounded-full ring-2 ring-white/10"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}
          />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex text-slate-300 transition hover:text-white md:hidden"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#07060f]/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto max-w-6xl px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["✦ For You", "/for-you"],
                  ["♥ Following", "/following"],
                  ["Popular", "/popular"],
                  ["Saved", "/saved"],
                  ["History", "/history"],
                  ["About", "/about"],
                ] as [string, string][]
              ).map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.07]"
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Topics
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DISPLAY_CATEGORIES.map((c) => (
                  <Link
                    key={c}
                    href={`/category/${c}`}
                    className="rounded-full border bg-white/[0.03] px-2.5 py-1 text-xs text-slate-200"
                    style={{ borderColor: `${CATEGORY_META[c].color}40` }}
                  >
                    {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
