"use client";

import dynamic from "next/dynamic";
import type { GlobePoint } from "@/lib/news";

// Load the Cesium component (which statically imports the heavy cesium module)
// client-side only, so it never evaluates on the server.
const Inner = dynamic(() => import("@/components/CesiumGlobeInner"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[62vh] min-h-[440px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#05070f]">
      <div className="absolute inset-0 flex items-center justify-center text-sm text-sky-300/60">
        Loading satellite Earth…
      </div>
    </div>
  ),
});

export default function CesiumGlobe({
  locations,
}: {
  locations: GlobePoint[];
}) {
  return <Inner locations={locations} />;
}
