"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { CATEGORY_META, DISPLAY_CATEGORIES } from "@/lib/categories";
import { LEAN_META, FEEDS } from "@/lib/feeds";

// One-screen starter: pick topics (+ optionally a few outlets), write them
// straight into `follows`, land on a For You / Following that already works.
const STARTER_SOURCES = FEEDS.filter((f) =>
  ["bbc", "aljazeera", "npr", "telegraph", "huffpost", "foxnews"].includes(f.id),
);

export default function WelcomePicker({ userId }: { userId: string }) {
  const router = useRouter();
  const [topics, setTopics] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (set: Set<string>, v: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  async function finish() {
    if (saving) return;
    setSaving(true);
    const rows = [
      ...[...topics].map((t) => ({ user_id: userId, kind: "category", value: t })),
      ...[...sources].map((s) => ({ user_id: userId, kind: "source", value: s })),
    ];
    if (rows.length > 0) {
      // upsert-style tolerance: unique(user_id,kind,value) — ignore dupes
      await getBrowserSupabase()
        .from("follows")
        .upsert(rows, { onConflict: "user_id,kind,value", ignoreDuplicates: true });
    }
    router.push(rows.length > 0 ? "/for-you" : "/");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-lg font-medium text-[#ece8e1]">
          Pick a few topics
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          These power your For You feed and your wire.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DISPLAY_CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            const active = topics.has(c);
            return (
              <button
                key={c}
                onClick={() => toggle(topics, c, setTopics)}
                className="rounded-full border px-4 py-2 text-sm transition"
                style={
                  active
                    ? {
                        borderColor: `${meta.color}80`,
                        background: `${meta.color}1f`,
                        color: "#fff",
                      }
                    : { borderColor: "rgba(255,255,255,0.12)", color: "#cbd5e1" }
                }
              >
                {meta.emoji} {meta.label} {active && "✓"}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-[#ece8e1]">
          Follow some outlets{" "}
          <span className="text-sm font-normal text-slate-500">(optional)</span>
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          A balanced mix across the spectrum makes your lean meter interesting.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STARTER_SOURCES.map((f) => {
            const active = sources.has(f.id);
            const lean = LEAN_META[f.lean];
            return (
              <button
                key={f.id}
                onClick={() => toggle(sources, f.id, setSources)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-cyan-400/60 bg-cyan-400/10 text-white"
                    : "border-white/[0.12] text-slate-300 hover:border-white/25"
                }`}
              >
                {f.name}{" "}
                <span style={{ color: lean.color }} className="text-xs">
                  {lean.label}
                </span>{" "}
                {active && "✓"}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={finish}
          disabled={saving}
          className="aurora-bg rounded-full px-6 py-3 text-sm font-semibold text-[#07060f] transition hover:brightness-110 disabled:opacity-60"
        >
          {saving
            ? "Setting up…"
            : topics.size + sources.size > 0
              ? `Start reading (${topics.size + sources.size} followed) →`
              : "Start reading →"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-slate-500 transition hover:text-slate-300"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
