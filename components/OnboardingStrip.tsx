"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "gn_onboarded";
const STEPS: [string, string][] = [
  ["🌍 Spin the globe", "#globe"],
  ["📈 See what's popular", "/popular"],
  ["♥ Follow your world", "/following"],
  ["✦ Get For You picks", "/for-you"],
  ["ℹ️ How ranking works", "/about"],
];

// One-time, dismissible welcome for first-time visitors — introduces every
// core destination up front so nobody has to scroll to discover the app.
export default function OnboardingStrip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(KEY, "1");
    setShow(false);
  }

  return (
    <div className="glass relative mt-6 rounded-2xl p-4 sm:p-5">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-slate-500 transition hover:text-white"
      >
        ✕
      </button>
      <div className="font-display text-sm font-medium text-[#ece8e1]">
        New here? Everything you can do 👋
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.06]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
