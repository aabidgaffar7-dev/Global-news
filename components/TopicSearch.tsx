"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Jump to /topic/[word] for any word, not just the trending ones.
export default function TopicSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const word = value.trim().toLowerCase().split(/\s+/)[0] ?? "";
    if (!/^[\p{L}\p{N}]{2,40}$/u.test(word)) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/topic/${encodeURIComponent(word)}`);
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-md" role="search">
      <label htmlFor="topic-search" className="sr-only">
        Look up a topic
      </label>
      <div className="flex gap-2">
        <input
          id="topic-search"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Look up any word, e.g. election"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
        >
          Go
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-amber-400">
          Enter a single word (letters or numbers, 2+ characters).
        </p>
      )}
    </form>
  );
}
