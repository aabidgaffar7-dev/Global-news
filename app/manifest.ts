import type { MetadataRoute } from "next";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

// Makes GlobeNews installable as an app (Add to Home Screen / desktop install).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: BRAND_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#07060f",
    theme_color: "#07060f",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/pwa-icon", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
