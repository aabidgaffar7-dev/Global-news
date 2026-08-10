"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

// Public writing needs two escape hatches: authors can remove their own work,
// and everyone else can flag what shouldn't be here. Deletes are soft so
// thread structure (and replies) survive.
export default function ModTools({
  kind,
  id,
  ownerId,
  userId,
  onDeleted,
}: {
  kind: "post" | "comment";
  id: string;
  ownerId: string;
  userId: string | null;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "done" | "reported">(
    "idle",
  );
  const isOwner = !!userId && userId === ownerId;

  async function remove() {
    const sb = getBrowserSupabase();
    const table = kind === "post" ? "posts" : "comments";
    const patch =
      kind === "post" ? { deleted: true } : { deleted: true, body: "[removed]" };
    const { error } = await sb.from(table).update(patch).eq("id", id);
    if (error) return setState("idle");
    setState("done");
    onDeleted?.();
    if (kind === "post") router.push("/community");
    else router.refresh();
  }

  async function report() {
    if (!userId) return router.push("/login");
    await getBrowserSupabase().from("reports").upsert(
      { reporter_id: userId, target_type: kind, target_id: id },
      { onConflict: "reporter_id,target_type,target_id" },
    );
    setState("reported");
  }

  if (state === "done") return null;
  if (state === "reported")
    return <span className="text-xs text-slate-500">Reported — thank you</span>;

  return (
    <span className="flex items-center gap-1">
      {isOwner ? (
        state === "confirm" ? (
          <>
            <button
              onClick={remove}
              className="rounded-full px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-400/10"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setState("idle")}
              className="rounded-full px-2 py-1 text-xs text-slate-500 transition hover:text-slate-300"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setState("confirm")}
            className="rounded-full px-2 py-1 text-xs text-slate-500 transition hover:text-rose-300"
          >
            Delete
          </button>
        )
      ) : userId ? (
        <button
          onClick={report}
          className="rounded-full px-2 py-1 text-xs text-slate-500 transition hover:text-amber-300"
        >
          Report
        </button>
      ) : null}
    </span>
  );
}
