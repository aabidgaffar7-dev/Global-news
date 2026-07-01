import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GlobeNews — a neutral, popularity-ranked world news hub";

// Default social-share card for pages that don't set their own (home, about,
// popular, categories…). Article pages override this with the story's image.
export default function OpengraphImage() {
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
          Neutral · Popularity-ranked
        </div>
        <div style={{ display: "flex", fontSize: 132, fontWeight: 600, marginTop: 14 }}>
          <span>Globe</span>
          <span style={{ color: "#a78bfa", fontStyle: "italic" }}>News</span>
        </div>
        <div style={{ fontSize: 38, color: "#94a3b8", marginTop: 18 }}>
          The world&apos;s news, ranked by people
        </div>
      </div>
    ),
    { ...size },
  );
}
