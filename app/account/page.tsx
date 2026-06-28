import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import ProfileEditor from "@/components/ProfileEditor";
import SignOutButton from "@/components/SignOutButton";
import { getUser, getServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = await getServerSupabase();
  const [{ data: profile }, { data: history }, { data: follows }] =
    await Promise.all([
      sb
        .from("profiles")
        .select("display_name,bio,created_at")
        .eq("id", user.id)
        .maybeSingle(),
      sb.from("reading_history").select("source,category").eq("user_id", user.id),
      sb.from("follows").select("kind").eq("user_id", user.id),
    ]);

  const articlesRead = history?.length ?? 0;
  const sources = new Set((history ?? []).map((h) => h.source)).size;
  const categories = new Set((history ?? []).map((h) => h.category)).size;
  const following = follows?.length ?? 0;
  const name = profile?.display_name ?? "Reader";
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : "—";

  const stats = [
    { label: "Articles read", value: articlesRead, icon: "👁" },
    { label: "Sources", value: sources, icon: "🏛️" },
    { label: "Categories", value: categories, icon: "🗂️" },
    { label: "Following", value: following, icon: "♥" },
  ];

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to Home
          </Link>
          <SignOutButton />
        </div>

        <h1 className="font-display mt-6 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
          Account <span className="aurora-text italic">&amp; Settings</span>
        </h1>

        {/* Profile */}
        <div className="glass mt-6 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-medium text-white"
              style={{
                background: "linear-gradient(135deg,#22d3ee,#8b5cf6,#ec4899)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-medium text-white">
                  {name}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                  ✓ Verified
                </span>
              </div>
              <p className="text-sm text-slate-400">{user.email}</p>
              <p className="text-xs text-slate-500">Member since {joined}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <ProfileEditor
              userId={user.id}
              initialName={profile?.display_name ?? ""}
              initialBio={profile?.bio ?? ""}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <div className="text-lg" aria-hidden>
                {s.icon}
              </div>
              <div className="font-display mt-1 text-2xl font-medium text-white">
                {s.value}
              </div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Your reading activity powers your For You feed and the global
          popularity ranking.
        </p>
      </main>
    </div>
  );
}
