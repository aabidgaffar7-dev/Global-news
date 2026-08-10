"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { timeAgo } from "@/lib/format";
import type { ArticleCommunity, CommentNode } from "@/lib/community";

// Reddit-shaped discussion: a vote bar that scores the story itself, then a
// threaded conversation under it. Optimistic everywhere — a vote or reply
// should feel instant, and roll back if the write fails.

export function ArticleVotes({
  link,
  userId,
  initialScore,
  initialVote,
  commentCount,
}: {
  link: string;
  userId: string | null;
  initialScore: number;
  initialVote: number;
  commentCount: number;
}) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState(initialVote);
  const [busy, setBusy] = useState(false);

  async function cast(next: 1 | -1) {
    if (!userId) return router.push("/login?next=" + encodeURIComponent(location.pathname));
    if (busy) return;
    setBusy(true);
    const applied = vote === next ? 0 : next; // clicking the same arrow undoes it
    const prevVote = vote;
    const prevScore = score;
    setVote(applied);
    setScore(score - prevVote + applied);

    const sb = getBrowserSupabase();
    const { error } =
      applied === 0
        ? await sb.from("article_votes").delete().eq("link", link).eq("user_id", userId)
        : await sb
            .from("article_votes")
            .upsert({ link, user_id: userId, value: applied }, { onConflict: "link,user_id" });
    if (error) {
      setVote(prevVote);
      setScore(prevScore);
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1">
        <button
          onClick={() => cast(1)}
          disabled={busy}
          aria-label="Upvote this story"
          aria-pressed={vote === 1}
          className={`rounded-full p-1.5 transition disabled:opacity-50 ${
            vote === 1
              ? "bg-cyan-400/20 text-cyan-300"
              : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
          }`}
        >
          <Icon name="up" size={16} />
        </button>
        <span
          className={`min-w-[2ch] text-center text-sm font-semibold tabular-nums ${
            vote === 1 ? "text-cyan-300" : vote === -1 ? "text-rose-300" : "text-slate-200"
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => cast(-1)}
          disabled={busy}
          aria-label="Downvote this story"
          aria-pressed={vote === -1}
          className={`rounded-full p-1.5 transition disabled:opacity-50 ${
            vote === -1
              ? "bg-rose-400/20 text-rose-300"
              : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
          }`}
        >
          <Icon name="down" size={16} />
        </button>
      </div>
      <a
        href="#discussion"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
      >
        <Icon name="comment" size={15} />
        {commentCount}
      </a>
    </div>
  );
}

export function Discussion({
  link,
  community,
}: {
  link: string;
  community: ArticleCommunity;
}) {
  const { userId, comments, commentCount } = community;
  const [tree, setTree] = useState<CommentNode[]>(comments);

  function addLocal(node: CommentNode, parentId: string | null) {
    if (!parentId) {
      setTree((t) => [node, ...t]);
      return;
    }
    const insert = (nodes: CommentNode[]): CommentNode[] =>
      nodes.map((n) =>
        n.id === parentId
          ? { ...n, replies: [...n.replies, node] }
          : { ...n, replies: insert(n.replies) },
      );
    setTree((t) => insert(t));
  }

  return (
    <section id="discussion" className="mt-12 scroll-mt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/10 pb-3">
        <h2 className="font-display flex items-center gap-2 text-xl font-medium text-[#ece8e1]">
          <Icon name="users" size={18} className="text-cyan-300" />
          Discussion
          <span className="text-sm font-normal text-slate-500">
            {commentCount || "no"} {commentCount === 1 ? "comment" : "comments"}
          </span>
        </h2>
        <p className="text-xs text-slate-500">
          Be decent. Disagree with the argument, not the person.
        </p>
      </div>

      <div className="mt-5">
        <CommentForm
          link={link}
          userId={userId}
          parentId={null}
          onPosted={(n) => addLocal(n, null)}
        />
      </div>

      {tree.length === 0 ? (
        <p className="glass mt-5 rounded-2xl p-8 text-center text-sm text-slate-400">
          No one has weighed in yet — start the conversation.
        </p>
      ) : (
        <ol className="mt-6 space-y-5">
          {tree.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              link={link}
              userId={userId}
              depth={0}
              onReply={addLocal}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function CommentItem({
  node,
  link,
  userId,
  depth,
  onReply,
}: {
  node: CommentNode;
  link: string;
  userId: string | null;
  depth: number;
  onReply: (n: CommentNode, parentId: string | null) => void;
}) {
  const router = useRouter();
  const [score, setScore] = useState(node.score);
  const [vote, setVote] = useState(node.myVote);
  const [replying, setReplying] = useState(false);

  async function cast(next: 1 | -1) {
    if (!userId) return router.push("/login");
    const applied = vote === next ? 0 : next;
    const pv = vote;
    const ps = score;
    setVote(applied);
    setScore(score - pv + applied);
    const sb = getBrowserSupabase();
    const { error } =
      applied === 0
        ? await sb
            .from("comment_votes")
            .delete()
            .eq("comment_id", node.id)
            .eq("user_id", userId)
        : await sb.from("comment_votes").upsert(
            { comment_id: node.id, user_id: userId, value: applied },
            { onConflict: "comment_id,user_id" },
          );
    if (error) {
      setVote(pv);
      setScore(ps);
    }
  }

  return (
    <li className={depth > 0 ? "border-l border-white/10 pl-4" : ""}>
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-300">{node.author}</span>
          <span>· {timeAgo(node.createdAt)}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-200">
          {node.body}
        </p>
        <div className="mt-3 flex items-center gap-1 text-xs">
          <button
            onClick={() => cast(1)}
            aria-label="Upvote comment"
            className={`rounded-full p-1.5 transition ${
              vote === 1 ? "text-cyan-300" : "text-slate-500 hover:text-slate-200"
            }`}
          >
            <Icon name="up" size={14} />
          </button>
          <span className="min-w-[2ch] text-center font-semibold tabular-nums text-slate-300">
            {score}
          </span>
          <button
            onClick={() => cast(-1)}
            aria-label="Downvote comment"
            className={`rounded-full p-1.5 transition ${
              vote === -1 ? "text-rose-300" : "text-slate-500 hover:text-slate-200"
            }`}
          >
            <Icon name="down" size={14} />
          </button>
          {depth < 3 && (
            <button
              onClick={() => setReplying((r) => !r)}
              className="ml-2 rounded-full px-2.5 py-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
            >
              Reply
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-3">
            <CommentForm
              link={link}
              userId={userId}
              parentId={node.id}
              compact
              onPosted={(n) => {
                onReply(n, node.id);
                setReplying(false);
              }}
            />
          </div>
        )}
      </div>

      {node.replies.length > 0 && (
        <ol className="mt-3 space-y-3">
          {node.replies.map((r) => (
            <CommentItem
              key={r.id}
              node={r}
              link={link}
              userId={userId}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

function CommentForm({
  link,
  userId,
  parentId,
  compact,
  onPosted,
}: {
  link: string;
  userId: string | null;
  parentId: string | null;
  compact?: boolean;
  onPosted: (n: CommentNode) => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!userId)
    return (
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <p className="text-sm text-slate-400">
          Sign in to join the conversation.
        </p>
        <Link
          href="/login"
          className="aurora-bg rounded-full px-4 py-2 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
        >
          Sign in
        </Link>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    const sb = getBrowserSupabase();
    const { data, error } = await sb
      .from("comments")
      .insert({ link, user_id: userId, parent_id: parentId, body: text })
      .select("id,created_at")
      .single();
    if (error || !data) {
      setError("Couldn't post that — try again.");
      setBusy(false);
      return;
    }
    const { data: prof } = await sb
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    onPosted({
      id: data.id as string,
      body: text,
      author: (prof?.display_name as string) || "You",
      authorId: userId!,
      createdAt: data.created_at as string,
      score: 0,
      myVote: 0,
      deleted: false,
      replies: [],
    });
    setBody("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 2 : 3}
        maxLength={4000}
        placeholder={parentId ? "Write a reply…" : "What's your take on this story?"}
        aria-label={parentId ? "Write a reply" : "Write a comment"}
        className="w-full resize-y bg-transparent px-2 py-1.5 text-sm text-slate-200 outline-none placeholder:text-slate-500"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-rose-300">{error}</span>
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="aurora-bg rounded-full px-4 py-1.5 text-sm font-semibold text-[#07060f] transition hover:brightness-110 disabled:opacity-40"
        >
          {busy ? "Posting…" : parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}
