"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export type SaveStory = {
  storyId: string;
  link: string;
  title: string;
  source: string;
  category: string;
  imageUrl?: string;
};

export default function SaveButton({
  userId,
  initialSaved,
  story,
}: {
  userId: string | null;
  initialSaved: boolean;
  story: SaveStory;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  if (!userId) {
    return (
      <Link
        href="/login"
        title="Sign in to save articles"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
      >
        ☆ Save
      </Link>
    );
  }

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next);

    const sb = getBrowserSupabase();
    const { error } = next
      ? await sb.from("saved").upsert(
          {
            user_id: userId,
            story_id: story.storyId,
            link: story.link,
            title: story.title,
            source: story.source,
            category: story.category,
            image_url: story.imageUrl ?? null,
          },
          { onConflict: "user_id,link", ignoreDuplicates: true },
        )
      : await sb
          .from("saved")
          .delete()
          .eq("user_id", userId)
          .eq("link", story.link);

    if (error) setSaved(!next); // rollback to match the DB
    setPending(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition disabled:opacity-60 ${
        saved
          ? "aurora-bg font-semibold text-[#07060f] hover:brightness-110"
          : "border border-white/15 text-slate-200 hover:border-cyan-400/40 hover:bg-white/[0.05]"
      }`}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
