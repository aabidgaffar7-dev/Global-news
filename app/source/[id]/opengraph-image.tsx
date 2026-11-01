import { ImageResponse } from "next/og";
import { FEEDS, LEAN_META } from "@/lib/feeds";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GlobeNews outlet profile";

// Social-share card for /source/[id]: outlet name, location and lean label.
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feed = FEEDS.find((f) => f.id === id);
  const name = feed?.name ?? "Outlet profile";
  const where = feed ? `${feed.city}, ${feed.country}` : "";
  const lean = feed ? LEAN_META[feed.lean] : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(1200px 700px at 28% 18%, #1a1440, #07060f 70%)",
          color: "#ece8e1",
          fontFamily: "Georgia, serif",
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 8,
            color: "#67e8f9",
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Source profile
        </div>
        <div
          style={{
            fontSize: name.length > 24 ? 84 : 112,
            fontWeight: 600,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          {name}
        </div>
        {where && (
          <div style={{ fontSize: 38, color: "#94a3b8", marginTop: 16 }}>
            {where}
          </div>
        )}
        {lean && (
          <div
            style={{
              marginTop: 32,
              padding: "10px 28px",
              borderRadius: 999,
              fontSize: 34,
              fontFamily: "system-ui, sans-serif",
              color: lean.color,
              border: `2px solid ${lean.color}`,
            }}
          >
            {lean.label}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            marginTop: 40,
            color: "#94a3b8",
          }}
        >
          <span>Globe</span>
          <span style={{ color: "#a78bfa", fontStyle: "italic" }}>News</span>
          <span style={{ marginLeft: 12 }}>· rated by vantage point</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
