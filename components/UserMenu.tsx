"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { supabaseEnabled } from "@/lib/supabase";

// Auth-aware account entry: anonymous visitors get an explicit "Sign in"
// (previously everyone saw a fake logged-in avatar); signed-in users get
// their initial + a menu. State comes from the Supabase browser session.
export default function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabaseEnabled) {
      setReady(true);
      return;
    }
    const sb = getBrowserSupabase();
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function signOut() {
    setOpen(false);
    await getBrowserSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Neutral placeholder while the session resolves — no fake state either way.
  if (!ready)
    return <span className="block h-8 w-8 rounded-full bg-white/5" aria-hidden />;

  if (!email)
    return (
      <Link
        href="/login"
        className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
      >
        Sign in
      </Link>
    );

  const initial = email.charAt(0).toUpperCase();
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-white/10 transition hover:ring-white/25"
        style={{ background: "linear-gradient(135deg,#22d3ee,#8b5cf6,#ec4899)" }}
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0a16]/95 p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="truncate px-3 py-2 text-xs text-slate-500">
            {email}
          </div>
          {(
            [
              ["Account", "/account"],
              ["Saved", "/saved"],
              ["Reading history", "/history"],
              ["How it works", "/about"],
            ] as [string, string][]
          ).map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
            >
              {label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-400/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
