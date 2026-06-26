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
      sb.from("profiles").select("display_name,bio,created_at").eq("id", user.id).maybeSingle(),
      sb.from("reading_history").select("source,category").eq("user_id", user.id),
      sb.from("follows").select("kind").eq("user_id", user.id),
    ]);

  const articlesRead = history?.length ?? 0;
  const sources = new Set((history ?? []).map((h) => h.source)).size;
  const categories = new Set((history ?? []).map((h) => h.category)).size;
  const following = follows?.length ?? 0;

  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : "—";

  const stats = [
    { label: "Articles Read", value: articlesRead, icon: "👁" },
    { label: "Sources", value: sources, icon: "🏢" },
    { label: "Categories", value: categories, icon: "🗂️" },
    { label: "Following", value: following, icon: "❤" },
  ];

  return (
    <div className="min-h-screen bg-[#03040a] text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Home
          </Link>
          <SignOutButton />
        </div>

        <h1 className="mt-5 text-3xl font-bold text-white">
          <span aria-hidden>👤 </span>Account &amp; Settings
        </h1>

        {/* Profile card */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-2xl font-bold text-white">
              {(profile?.display_name ?? user.email ?? "?")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {profile?.display_name ?? "Reader"}
              </h2>
              <p className="text-sm text-slate-400">{user.email}</p>
              <p className="text-xs text-slate-500">Joined {joined}</p>
            </div>
          </div>

          <div className="mt-6">
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
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center"
            >
              <div className="text-xl" aria-hidden>
                {s.icon}
              </div>
              <div className="mt-1 text-2xl font-bold text-white">{s.value}</div>
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
