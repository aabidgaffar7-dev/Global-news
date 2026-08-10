import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import ShareButton from "@/components/ShareButton";
import { PostVoteBar } from "@/components/Posts";
import { Discussion } from "@/components/Discussion";
import ModTools from "@/components/ModTools";
import { getPost, postLink } from "@/lib/posts";
import { getArticleCommunity } from "@/lib/community";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "Conversation not found" };
  return {
    title: post.title,
    description: post.body?.slice(0, 160) ?? `A reader conversation on GlobeNews`,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  // The thread reuses the article discussion engine, keyed to this post.
  const link = postLink(post.id);
  const community = await getArticleCommunity(link);

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/community"
            className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
          >
            ← All conversations
          </Link>
          <ShareButton title={post.title} path={`/community/${post.id}`} />
        </div>

        <article className="mt-6">
          {post.topic && (
            <span className="inline-block rounded-full bg-violet-400/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
              {post.topic}
            </span>
          )}
          <h1 className="font-display mt-2 text-balance text-3xl font-medium leading-tight text-[#ece8e1] sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Posted by{" "}
            <span className="text-slate-400">{post.author}</span> ·{" "}
            {timeAgo(post.createdAt)}
          </p>

          {post.body && (
            <div className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-300">
              {post.body}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3 border-y border-white/10 py-3">
            <PostVoteBar
              postId={post.id}
              userId={community.userId}
              initialScore={post.score}
              initialVote={post.myVote}
            />
            <span className="text-sm text-slate-500">
              {community.commentCount}{" "}
              {community.commentCount === 1 ? "reply" : "replies"}
            </span>
            <span className="ml-auto">
              <ModTools
                kind="post"
                id={post.id}
                ownerId={post.authorId}
                userId={community.userId}
              />
            </span>
          </div>
        </article>

        <Discussion link={link} community={community} />
      </main>
    </div>
  );
}
