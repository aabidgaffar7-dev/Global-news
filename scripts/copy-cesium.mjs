// Cesium ships prebuilt Workers/Assets that must be served over HTTP. Copy them
// into public/cesium so they're available at /cesium/* (CESIUM_BASE_URL). Runs
// on postinstall (locally + on Vercel) so the assets are always present.
import { cpSync, existsSync } from "node:fs";

const src = "node_modules/cesium/Build/Cesium";
const dest = "public/cesium";

try {
  if (!existsSync(src)) {
    console.warn("[copy-cesium] source not found, skipping:", src);
    process.exit(0);
  }
  cpSync(src, dest, { recursive: true });
  console.log("[copy-cesium] copied Cesium assets → public/cesium");
} catch (err) {
  console.warn("[copy-cesium] copy failed (non-fatal):", err?.message);
  process.exit(0);
}
