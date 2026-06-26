import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import LoginForm from "@/components/LoginForm";
import { getUser } from "@/lib/supabase-server";
import { supabaseEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/account");

  return (
    <div className="min-h-screen bg-[#03040a] text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <h1 className="text-2xl font-bold text-white">
            <span aria-hidden>✨ </span>Welcome to Global News Hub
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to follow regions &amp; topics, get personalized For You
            picks, and shape what rises in popularity.
          </p>

          <div className="mt-6">
            {supabaseEnabled ? (
              <LoginForm />
            ) : (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
                Accounts aren&apos;t configured yet (Supabase env vars missing).
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
