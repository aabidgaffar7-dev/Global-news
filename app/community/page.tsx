import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Icon from "@/components/Icon";
import { PostCard, PostComposer } from "@/components/Posts";
import { listPosts, type PostSort } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Community",
  description:
    "Start a conversation about anything in the news — and argue it out with other readers.",
};

const SORTS: { key: PostSort; label: string }[] = [
  { key: "hot", label: "Hot" },
  { key: "new", label: "New" },
  { key: "top", label: "Top" },
];

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const active: PostSort = SORTS.some((s) => s.key === sort)
    ? (sort as PostSort)
    : "hot";
  const { posts, userId } = await listPosts(active);

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <header className="mt-6 border-b border-white/10 pb-5">
          <h1 className="font-display text-3xl font-medium text-[#ece8e1] sm:text-4xl">
            The <span className="aurora-text italic">Community</span>
          </h1>
          <p className="mt-2 max-w-xl text-slate-400">
            The news is only half of it. Post an opinion about a person, a
            country, a claim — and let everyone argue it out.
          </p>
        </header>

        <div className="mt-6">
          <PostComposer userId={userId} />
        </div>

        <div className="mt-6 flex items-center gap-1">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={`/community?sort=${s.key}`}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                active === s.key
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="glass mt-5 rounded-2xl p-10 text-center">
            <Icon
              name="users"
              size={22}
              className="mx-auto mb-3 text-cyan-300/70"
            />
            <p className="text-slate-300">No conversations yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Be the first — say what you actually think about something in the
              news.
            </p>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} userId={userId} />
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
