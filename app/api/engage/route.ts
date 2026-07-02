import { NextRequest, NextResponse } from "next/server";
import { recordEngagement } from "@/lib/engagement";
import { safeHttpUrl } from "@/lib/url";

// Reader-signal beacon. Validates everything (kind whitelist, URL shape,
// length caps) and drops obvious crawlers so bots don't inflate the
// popularity ranking. Session-level dedupe happens client-side (ViewPing /
// ReadSourceButton) — this endpoint is the server-side floor, not the whole
// anti-abuse story.
const BOT_UA =
  /bot|crawl|spider|slurp|preview|fetch|monitor|scrape|curl|wget|python-requests|headless/i;

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT_UA.test(ua)) return NextResponse.json({ ok: true }); // silently ignore

    const body = (await req.json()) as {
      link?: unknown;
      kind?: unknown;
      title?: unknown;
      source?: unknown;
    };
    const kind = body.kind === "view" || body.kind === "click" ? body.kind : null;
    const link = safeHttpUrl(
      typeof body.link === "string" && body.link.length <= 2048
        ? body.link
        : undefined,
    );
    if (!kind || !link)
      return NextResponse.json({ ok: false }, { status: 400 });

    await recordEngagement(
      link,
      String(body.title ?? "").slice(0, 300),
      String(body.source ?? "").slice(0, 120),
      kind,
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
