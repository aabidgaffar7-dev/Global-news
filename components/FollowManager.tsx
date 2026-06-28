"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Follow = { kind: string; value: string };

export default function FollowManager({
  userId,
  initialFollows,
  categories,
  locations,
}: {
  userId: string;
  initialFollows: Follow[];
  categories: { slug: string; label: string; emoji: string }[];
  locations: string[];
}) {
  const router = useRouter();
  const [follows, setFollows] = useState<Follow[]>(initialFollows);
  const [keyword, setKeyword] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());

  const isFollowed = (kind: string, value: string) =>
    follows.some((f) => f.kind === kind && f.value === value);

  async function toggle(kind: string, value: string) {
    const key = `${kind}:${value}`;
    if (pending.has(key)) return; // ignore double-clicks while a write is in flight
    setPending((p) => new Set(p).add(key));

    const wasFollowed = isFollowed(kind, value);
    setFollows((f) =>
      wasFollowed
        ? f.filter((x) => !(x.kind === kind && x.value === value))
        : [...f, { kind, value }],
    );

    const sb = getBrowserSupabase();
    const { error } = wasFollowed
      ? await sb
          .from("follows")
          .delete()
          .eq("user_id", userId)
          .eq("kind", kind)
          .eq("value", value)
      : await sb.from("follows").insert({ user_id: userId, kind, value });

    if (error) {
      // roll the optimistic change back so the chip matches the DB
      setFollows((f) =>
        wasFollowed
          ? [...f, { kind, value }]
          : f.filter((x) => !(x.kind === kind && x.value === value)),
      );
    }
    setPending((p) => {
      const next = new Set(p);
      next.delete(key);
      return next;
    });
    router.refresh();
  }

  async function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    const k = keyword.trim().toLowerCase();
    setKeyword("");
    if (k && !isFollowed("keyword", k)) await toggle("keyword", k);
  }

  const keywords = follows.filter((f) => f.kind === "keyword");

  return (
    <div className="space-y-6">
      <Section title="Topics">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Chip
              key={c.slug}
              active={isFollowed("category", c.slug)}
              onClick={() => toggle("category", c.slug)}
            >
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Locations">
        <div className="flex flex-wrap gap-2">
          {locations.map((city) => (
            <Chip
              key={city}
              active={isFollowed("location", city)}
              onClick={() => toggle("location", city)}
            >
              📍 {city}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Keywords">
        <form onSubmit={addKeyword} className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. climate, elections, AI…"
            className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/40"
          />
          <button
            type="submit"
            className="aurora-bg rounded-full px-4 py-2 text-sm font-semibold text-[#07060f] transition hover:brightness-110"
          >
            Add
          </button>
        </form>
        {keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((k) => (
              <button
                key={k.value}
                onClick={() => toggle("keyword", k.value)}
                className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs text-sky-200 hover:bg-sky-400/20"
              >
                {k.value} ✕
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-300">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
      }`}
    >
      {children}
    </button>
  );
}
