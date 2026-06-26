"use client";

import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await getBrowserSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
    >
      Sign out
    </button>
  );
}
