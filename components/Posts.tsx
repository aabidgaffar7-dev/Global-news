"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { timeAgo } from "@/lib/format";
import type { PostSummary } from "@/lib/posts";

// Anyone can start a conversation about anything — a president, a country, a
// claim. The post is just the seed; the thread underneath is the point.

export function PostVoteBar({
  postId,
  userId,
  initialScore,
  initialVote,
  vertical,
}: {
  postId: string;
  userId: string | null;
  initialScore: number;
  initialVote: number;
  vertical?: boolean;
}) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState(initialVote);

  async function cast(next: 1 | -1, e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
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
            .from("post_votes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)
        : await sb
            .from("post_votes")
            .upsert(
              { post_id: postId, user_id: userId, value: applied },
              { onConflict: "post_id,user_id" },
            );
    if (error) {
      setVote(pv);
      setScore(ps);
    }
  }

  return (
    <div
      className={`flex items-center gap-0.5 ${vertical ? "flex-col" : ""}`}
    >
      <button
        onClick={(e) => cast(1, e)}
        aria-label="Upvote post"
        aria-pressed={vote === 1}
        className={`rounded-full p-1.5 transition ${
          vote === 1
            ? "bg-cyan-400/20 text-cyan-300"
            : "text-slate-500 hover:bg-white/10 hover:text-slate-200"
        }`}
      >
        <Icon name="up" size={15} />
      </button>
      <span
        className={`min-w-[2ch] text-center text-sm font-semibold tabular-nums ${
          vote === 1
            ? "text-cyan-300"
            : vote === -1
              ? "text-rose-300"
              : "text-slate-300"
        }`}
      >
        {score}
      </span>
      <button
        onClick={(e) => cast(-1, e)}
        aria-label="Downvote post"
        aria-pressed={vote === -1}
        className={`rounded-full p-1.5 transition ${
          vote === -1
            ? "bg-rose-400/20 text-rose-300"
            : "text-slate-500 hover:bg-white/10 hover:text-slate-200"
        }`}
      >
        <Icon name="down" size={15} />
      </button>
    </div>
  );
}

export function PostCard({
  post,
  userId,
}: {
  post: PostSummary;
  userId: string | null;
}) {
  return (
    <li className="glass rounded-2xl p-4 transition hover:border-white/25">
      <div className="flex gap-3">
        <PostVoteBar
          postId={post.id}
          userId={userId}
          initialScore={post.score}
          initialVote={post.myVote}
          vertical
        />
        <div className="min-w-0 flex-1">
          {post.topic && (
            <span className="inline-block rounded-full bg-violet-400/10 px-2 py-0.5 text-[11px] font-medium text-violet-300">
              {post.topic}
            </span>
          )}
          <Link href={`/community/${post.id}`} className="group block">
            <h3 className="font-display mt-1 text-lg font-medium leading-snug text-[#ece8e1] transition group-hover:text-white">
              {post.title}
            </h3>
            {post.body && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                {post.body}
              </p>
            )}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="text-slate-400">{post.author}</span>
            <span>· {timeAgo(post.createdAt)}</span>
            <Link
              href={`/community/${post.id}`}
              className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-cyan-300"
            >
              <Icon name="comment" size={13} />
              {post.commentCount}{" "}
              {post.commentCount === 1 ? "comment" : "comments"}
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

export function PostComposer({ userId }: { userId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!userId)
    return (
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <p className="text-sm text-slate-400">
          Sign in to start a conversation about anything.
        </p>
        <Link
          href="/login"
          className="aurora-bg rounded-full px-4 py-2 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
        >
          Sign in
        </Link>
      </div>
    );

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left text-sm text-slate-400 transition hover:border-cyan-400/40"
      >
        <Icon name="comment" size={16} className="text-cyan-300" />
        Start a conversation — a president, a country, a claim, anything…
      </button>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (t.length < 3 || busy) return;
    setBusy(true);
    setError("");
    const { data, error } = await getBrowserSupabase()
      .from("posts")
      .insert({
        user_id: userId,
        title: t,
        body: body.trim() || null,
        topic: topic.trim() || null,
      })
      .select("id")
      .single();
    if (error || !data) {
      setError("Couldn't post that — try again.");
      setBusy(false);
      return;
    }
    router.push(`/community/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        placeholder="What's your take?"
        aria-label="Post title"
        className="w-full bg-transparent text-lg font-medium text-slate-100 outline-none placeholder:text-slate-500"
      />
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        maxLength={60}
        placeholder="Topic (optional) — e.g. Donald Trump, Ukraine, AI"
        aria-label="Topic"
        className="mt-2 w-full bg-transparent text-sm text-violet-300 outline-none placeholder:text-slate-500"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={10000}
        placeholder="Say more (optional)…"
        aria-label="Post body"
        className="mt-2 w-full resize-y bg-transparent text-sm leading-relaxed text-slate-200 outline-none placeholder:text-slate-500"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-rose-300">{error}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full px-3 py-1.5 text-sm text-slate-400 transition hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || title.trim().length < 3}
            className="aurora-bg rounded-full px-4 py-1.5 text-sm font-semibold text-[#07060f] transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function PollComposer({ userId }: { userId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!userId)
    return (
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <p className="text-sm text-slate-400">
          Sign in to ask the community your own question.
        </p>
        <Link
          href="/login"
          className="aurora-bg rounded-full px-4 py-2 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
        >
          Sign in
        </Link>
      </div>
    );

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left text-sm text-slate-400 transition hover:border-cyan-400/40"
      >
        <Icon name="chart" size={16} className="text-cyan-300" />
        Ask the community your own question…
      </button>
    );

  const clean = options.map((o) => o.trim()).filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length < 5 || clean.length < 2 || busy) return;
    setBusy(true);
    setError("");
    const { error } = await getBrowserSupabase().from("polls").insert({
      question: question.trim(),
      options: clean,
      created_by: userId,
    });
    if (error) {
      setError("Couldn't create that poll — try again.");
      setBusy(false);
      return;
    }
    setQuestion("");
    setOptions(["", ""]);
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-4">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        maxLength={200}
        placeholder="Your question — e.g. Is coverage of this war balanced?"
        aria-label="Poll question"
        className="w-full bg-transparent text-base font-medium text-slate-100 outline-none placeholder:text-slate-500"
      />
      <ul className="mt-3 space-y-2">
        {options.map((o, i) => (
          <li key={i}>
            <input
              value={o}
              onChange={(e) =>
                setOptions((prev) =>
                  prev.map((p, j) => (j === i ? e.target.value : p)),
                )
              }
              maxLength={120}
              placeholder={`Option ${i + 1}`}
              aria-label={`Option ${i + 1}`}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/40"
            />
          </li>
        ))}
      </ul>
      {options.length < 6 && (
        <button
          type="button"
          onClick={() => setOptions((o) => [...o, ""])}
          className="mt-2 text-xs text-cyan-300 transition hover:text-cyan-200"
        >
          + Add option
        </button>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-rose-300">{error}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full px-3 py-1.5 text-sm text-slate-400 transition hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || question.trim().length < 5 || clean.length < 2}
            className="aurora-bg rounded-full px-4 py-1.5 text-sm font-semibold text-[#07060f] transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create poll"}
          </button>
        </div>
      </div>
    </form>
  );
}
