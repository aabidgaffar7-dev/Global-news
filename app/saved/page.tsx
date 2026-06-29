import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import StoryImage from "@/components/StoryImage";
import { getUser, getServerSupabase } from "@/lib/supabase-server";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type SavedRow = {
  story_id: string | null;
  link: string;
  title: string | null;
  source: string | null;
  category: string | null;
  image_url: string | null;
  saved_at: string;
};

export default async function SavedPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sb = await getServerSupabase();
  // Bounded query — paginate with a "load more" once readers save a lot.
  const { data } = await sb
    .from("saved")
    .select("story_id,link,title,source,category,image_url,saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(60);
  const rows = (data ?? []) as SavedRow[];

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <h1 className="font-display mt-6 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
          Saved <span className="aurora-text italic">for later</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Articles you&apos;ve bookmarked to read when you&apos;re ready.
        </p>

        {rows.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-10 text-center text-slate-400">
            Nothing saved yet — tap <span className="text-slate-200">☆ Save</span>{" "}
            on any article and it&apos;ll wait for you here.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <SavedRowCard key={r.link} row={r} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function SavedRowCard({ row }: { row: SavedRow }) {
  const cat = row.category ? CATEGORY_META[row.category as Category] : null;
  const href = row.story_id ? `/article/${row.story_id}` : row.link || "/";
  return (
    <li>
      <Link
        href={href}
        className="group glass flex items-center gap-4 rounded-2xl p-3 transition hover:-translate-y-0.5 hover:border-white/25"
      >
        <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
          <StoryImage
            src={row.image_url ?? undefined}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display line-clamp-2 font-medium text-[#ece8e1] group-hover:text-white">
            {row.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            {cat && (
              <span
                className="rounded-full px-1.5 py-0.5 font-medium"
                style={{ color: cat.color, background: `${cat.color}1a` }}
              >
                {cat.emoji} {cat.label}
              </span>
            )}
            <span className="font-medium text-slate-300">{row.source}</span>
            <span>· saved {timeAgo(row.saved_at)}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
