import { ImageResponse } from "next/og";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { getAllStories, storiesInCategory } from "@/lib/news";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GlobeNews category";
export const revalidate = 600;

// Social-share card for /category/[slug]: category name and live story count.
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = CATEGORY_META[slug as Category];
  let count = 0;
  try {
    count = meta ? storiesInCategory(await getAllStories(), slug as Category).length : 0;
  } catch {
    count = 0;
  }
  const color = meta?.color ?? "#67e8f9";

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
            color,
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Category
        </div>
        <div style={{ fontSize: 120, fontWeight: 600, marginTop: 20 }}>
          {meta?.label ?? "News"}
        </div>
        {meta && (
          <div style={{ fontSize: 36, color: "#94a3b8", marginTop: 16 }}>
            {meta.description}
          </div>
        )}
        {count > 0 && (
          <div
            style={{
              marginTop: 32,
              padding: "10px 28px",
              borderRadius: 999,
              fontSize: 34,
              fontFamily: "system-ui, sans-serif",
              color,
              border: `2px solid ${color}`,
            }}
          >
            {count} stories right now
          </div>
        )}
        <div style={{ display: "flex", fontSize: 30, marginTop: 40, color: "#94a3b8" }}>
          <span>Globe</span>
          <span style={{ color: "#a78bfa", fontStyle: "italic" }}>News</span>
          <span style={{ marginLeft: 12 }}>· rated by vantage point</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
