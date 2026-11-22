"use client";

// Keep client-side filter choices (sort, region, lean) in the page URL so a
// filtered view can be shared or bookmarked, without making cached pages
// dynamic: the server never reads these params, the browser does. Writes use
// history.replaceState, which Next.js integrates with its router.
import { useCallback, useSyncExternalStore } from "react";

const EVENT = "gn-url-state-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const read = () => window.location.search;

/**
 * [params, update]. `params` is empty during server render and hydration's
 * first pass, then reflects the real URL. `update` sets (or, for null,
 * removes) each given key and replaces the current history entry.
 */
export function useUrlParams(): [
  URLSearchParams,
  (changes: Record<string, string | null>) => void,
] {
  const search = useSyncExternalStore(subscribe, read, () => "");
  const update = useCallback((changes: Record<string, string | null>) => {
    const q = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    const str = q.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${str ? `?${str}` : ""}${window.location.hash}`,
    );
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [new URLSearchParams(search), update];
}
