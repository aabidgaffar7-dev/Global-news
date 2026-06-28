"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function ProfileEditor({
  userId,
  initialName,
  initialBio,
}: {
  userId: string;
  initialName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const { error } = await getBrowserSupabase()
      .from("profiles")
      .update({ display_name: name, bio })
      .eq("id", userId);
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-400">Display name</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-400/40"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            setSaved(false);
          }}
          rows={2}
          placeholder="Tech enthusiast and global news follower…"
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-400/40"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="aurora-bg rounded-full px-5 py-2 text-sm font-semibold text-[#07060f] transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>
    </div>
  );
}
