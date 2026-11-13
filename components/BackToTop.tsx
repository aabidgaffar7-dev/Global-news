"use client";

import { useEffect, useState } from "react";

// Floating "back to top" button, shown after scrolling a screen or so.
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-40 rounded-full border border-white/15 bg-[#0b0a1a]/90 px-3.5 py-2 text-sm text-slate-200 shadow-lg backdrop-blur transition hover:border-cyan-400/40"
    >
      ↑ Top
    </button>
  );
}
