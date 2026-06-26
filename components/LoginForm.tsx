"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const sb = getBrowserSupabase();

    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      // With email confirmation off, a session is returned immediately.
      if (!data.session) {
        // Supabase returns user with empty identities[] when the email already
        // exists (anti-enumeration) — don't tell them to check a mail we won't send.
        const alreadyExists = (data.user?.identities?.length ?? 0) === 0;
        setNotice(
          alreadyExists
            ? "That email is already registered — try signing in instead."
            : "Account created — check your email to confirm, then sign in.",
        );
        setMode("signin");
        return;
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full py-1.5 transition ${mode === "signin" ? "bg-sky-500 text-white" : "text-slate-400"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full py-1.5 transition ${mode === "signup" ? "bg-sky-500 text-white" : "text-slate-400"}`}
        >
          Create account
        </button>
      </div>

      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
      />
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (6+ characters)"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
      />

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {notice && <p className="text-sm text-amber-300">{notice}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-sky-500 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
      >
        {loading
          ? "…"
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
