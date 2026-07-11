import { ImageResponse } from "next/og";

// 512x512 install icon (Chrome requires >=192px for PWA installability;
// app/icon.tsx is only 32px). Same glowing-globe mark as the favicon.
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07060f",
        }}
      >
        <div
          style={{
            width: 352,
            height: 352,
            borderRadius: "50%",
            background: "radial-gradient(circle at 38% 32%, #2563eb, #0b1230)",
            boxShadow: "0 0 96px rgba(34,211,238,0.8)",
          }}
        />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
