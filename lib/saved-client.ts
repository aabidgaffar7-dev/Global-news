"use client";

import { useEffect, useSyncExternalStore } from "react";
import { supabaseEnabled } from "@/lib/supabase";
import { getBrowserSupabase } from "@/lib/supabase-browser";

// The reader's saved links, loaded ONCE per page view in the browser and
// shared by every Save star on the page. Cached pages (home, category, search)
// can't know who is reading, so this is how they show "★ Saved" without a
// query per card. Bounded: readers with more saves than LIMIT just see
// "☆ Save" on older ones, and saving again is a no-op (upsert ignores
// duplicates).

export type SavedLinks = { userId: string | null; links: Set<string> } | null;

const LIMIT = 500;

let state: SavedLinks = null;
let loading: Promise<void> | null = null;
let watchingAuth = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function load() {
  if (loading || !supabaseEnabled) return;
  const sb = getBrowserSupabase();
  if (!watchingAuth) {
    watchingAuth = true;
    // Signing in or out without a full reload must not leave stale stars.
    sb.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? null;
      if (state && state.userId !== id) {
        state = null;
        loading = null;
        emit();
        load();
      }
    });
  }
  loading = (async () => {
    const { data: auth } = await sb.auth.getUser();
    const userId = auth.user?.id ?? null;
    const links = new Set<string>();
    if (userId) {
      const { data } = await sb
        .from("saved")
        .select("link")
        .eq("user_id", userId)
        .order("saved_at", { ascending: false })
        .limit(LIMIT);
      for (const row of data ?? []) links.add(row.link as string);
    }
    state = { userId, links };
    emit();
  })().catch(() => {
    loading = null; // let a later mount retry
  });
}

/** Record a save/unsave so other stars for the same link stay in step. */
export function markSaved(link: string, saved: boolean) {
  if (!state) return;
  const links = new Set(state.links);
  if (saved) links.add(link);
  else links.delete(link);
  state = { userId: state.userId, links };
  emit();
}

/** null until loaded (or when Supabase isn't configured). */
export function useSavedLinks(): SavedLinks {
  useEffect(load, []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}
