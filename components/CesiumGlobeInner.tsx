"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as Cesium from "cesium";
import StoryImage from "@/components/StoryImage";
import type { GlobePoint, Story } from "@/lib/news";
import { LEAN_META, type Lean } from "@/lib/feeds";
import { formatCount, timeAgo } from "@/lib/format";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Cesium loads its Workers/Assets over HTTP from CESIUM_BASE_URL.
(globalThis as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL =
  "/cesium";

const LEAN_LEGEND: Lean[] = [
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "intl",
];

export default function CesiumGlobeInner({
  locations,
}: {
  locations: GlobePoint[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GlobePoint | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let viewer: Cesium.Viewer | undefined;
    let handler: Cesium.ScreenSpaceEventHandler | undefined;
    const idToLoc = new Map(locations.map((l) => [l.id, l]));

    try {
      if (!containerRef.current) return;

      viewer = new Cesium.Viewer(containerRef.current, {
        // Free Esri World Imagery — satellite basemap, no token required.
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(
          Cesium.ArcGisMapServerImageryProvider.fromUrl(
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
          ),
          {},
        ),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      });

      // Cesium types mark several scene sub-objects optional; we know they exist.
      const scene = viewer.scene as unknown as {
        backgroundColor: Cesium.Color;
        skyAtmosphere: { show: boolean };
        fog: { enabled: boolean };
        globe: { baseColor: Cesium.Color };
        canvas: HTMLCanvasElement;
        pick: (p: Cesium.Cartesian2) => unknown;
      };
      scene.backgroundColor = Cesium.Color.fromCssColorString("#05070f");
      scene.skyAtmosphere.show = true;
      scene.fog.enabled = true;
      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);
      scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1020");

      const near = (n: number, nv: number, f: number, fv: number) =>
        new Cesium.NearFarScalar(n, nv, f, fv);

      for (const loc of locations) {
        const isNews = loc.storyCount > 0;
        if (!isNews && loc.tier !== 1) continue;

        const color = Cesium.Color.fromCssColorString(
          isNews
            ? loc.dominantLean
              ? LEAN_META[loc.dominantLean].color
              : "#38bdf8"
            : "#94a3b8",
        );

        viewer.entities.add({
          id: loc.id,
          position: Cesium.Cartesian3.fromDegrees(loc.lng, loc.lat),
          point: {
            pixelSize: isNews ? 7 + Math.min(loc.storyCount, 12) : 5,
            color: color.withAlpha(isNews ? 0.95 : 0.55),
            outlineColor: Cesium.Color.WHITE.withAlpha(isNews ? 0.6 : 0.2),
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: loc.city,
            font: "600 13px system-ui, sans-serif",
            fillColor: isNews
              ? Cesium.Color.fromCssColorString("#f1f5f9")
              : Cesium.Color.fromCssColorString("#cbd5e1").withAlpha(0.85),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK.withAlpha(0.85),
            outlineWidth: 3,
            pixelOffset: new Cesium.Cartesian2(0, -13),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            translucencyByDistance: isNews
              ? near(2.0e7, 1.0, 5.0e7, 0.25)
              : near(6.0e6, 1.0, 1.6e7, 0.0),
            scaleByDistance: near(1.5e6, 1.1, 2.0e7, 0.7),
          },
        });
      }

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(5, 25, 2.4e7),
      });

      handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
        const picked = scene.pick(movement.position) as
          | { id?: { id?: string } }
          | undefined;
        const id = picked?.id?.id;
        const loc = id ? idToLoc.get(id) : undefined;
        if (loc && loc.storyCount > 0 && viewer) {
          setSelected(loc);
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(loc.lng, loc.lat, 1.6e6),
            duration: 1.2,
          });
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      setReady(true);
    } catch (e) {
      console.error("[cesium] init failed", e);
      setError(e instanceof Error ? e.message : String(e));
    }

    return () => {
      try {
        handler?.destroy();
      } catch {}
      try {
        viewer?.destroy();
      } catch {}
    };
  }, [locations]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="relative h-[62vh] min-h-[440px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#05070f]"
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-sky-300/60">
            {error ? (
              <span className="text-rose-300/90">Globe error: {error}</span>
            ) : (
              "Loading satellite Earth…"
            )}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Scroll to zoom from orbit to the street · drag to rotate · click a
        glowing city to read its top stories
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500">
        <span className="text-slate-400">City colour = local lean:</span>
        {LEAN_LEGEND.map((l) => (
          <span key={l} className="inline-flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: LEAN_META[l].color }}
            />
            {LEAN_META[l].label}
          </span>
        ))}
      </div>

      {selected && (
        <StoryPanel location={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function StoryPanel({
  location,
  onClose,
}: {
  location: GlobePoint;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#07060f]/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between border-b border-white/10 p-5">
        <h2 className="flex items-center gap-2 text-xl font-medium text-white">
          <span className="text-cyan-300" aria-hidden>
            📍
          </span>
          <span className="font-display">
            Top News from {location.city}
            <span className="block text-sm font-normal text-slate-400">
              {location.country}
            </span>
          </span>
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full border border-white/10 px-3 py-1 text-slate-300 transition hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
          <span aria-hidden>📈</span> Top {location.storyCount} Most Popular
          Stories
        </div>
        <ul className="space-y-3">
          {location.stories.map((story, i) => (
            <StoryRow key={story.id} story={story} rank={i + 1} />
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 p-3 text-center text-[11px] text-slate-500">
        Ranked by reader interest · {location.sources.join(", ")}
      </div>
    </div>
  );
}

function StoryRow({ story, rank }: { story: Story; rank: number }) {
  const lean = LEAN_META[story.lean];
  return (
    <li>
      <Link
        href={`/article/${story.id}`}
        className="group block rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
      >
        <div className="flex gap-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
            <StoryImage
              src={story.imageUrl}
              className="h-full w-full object-cover"
              fallbackClassName="flex h-full w-full items-center justify-center text-xl"
            />
            <span className="aurora-bg absolute left-1 top-1 rounded-full px-1.5 text-[10px] font-bold text-[#07060f]">
              #{rank}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display line-clamp-2 text-sm font-medium text-slate-100 group-hover:text-white">
              {story.title}
            </h3>
            {story.summary && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                {story.summary}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-slate-400">{story.source}</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{ color: lean.color, background: `${lean.color}1a` }}
            >
              {lean.label}
            </span>
            <span>· {timeAgo(story.publishedAt)}</span>
            {story.views ? <span>· 👁 {formatCount(story.views)}</span> : null}
          </span>
          <span className="aurora-text font-medium">Read More →</span>
        </div>
      </Link>
    </li>
  );
}
