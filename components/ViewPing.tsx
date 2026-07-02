"use client";

import { useEffect } from "react";

// Records one "view" per article per browser session — replacing the old
// server-side recording that counted every crawler hit and every refresh.
export default function ViewPing({
  link,
  title,
  source,
}: {
  link: string;
  title: string;
  source: string;
}) {
  useEffect(() => {
    const key = `gn_viewed:${link}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked — still record, just without dedupe
    }
    fetch("/api/engage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ link, title, source, kind: "view" }),
      keepalive: true,
    }).catch(() => {});
  }, [link, title, source]);

  return null;
}
