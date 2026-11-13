"use client";

// Client-side access to the remembered "Hide opinion" choice, for pages that
// filter in the browser (search, category) so they can stay cached. Reads and
// writes the same cookie middleware.ts sets from `?opinion=hide|show`.
import { useCallback, useSyncExternalStore } from "react";
import { OPINION_COOKIE, OPINION_COOKIE_MAX_AGE } from "@/lib/opinion";

const EVENT = "gn-opinion-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function readCookie(): boolean {
  return document.cookie
    .split("; ")
    .some((c) => c === `${OPINION_COOKIE}=1`);
}

/** [hideOpinion, setHideOpinion]; false during server render. */
export function useHideOpinion(): [boolean, (hide: boolean) => void] {
  const hide = useSyncExternalStore(subscribe, readCookie, () => false);
  const set = useCallback((next: boolean) => {
    document.cookie = `${OPINION_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${OPINION_COOKIE_MAX_AGE}; samesite=lax`;
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [hide, set];
}
