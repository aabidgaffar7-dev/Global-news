"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import StoryImage from "@/components/StoryImage";
import type { NewsLocation, Story } from "@/lib/news";
import { LEAN_META } from "@/lib/feeds";
import { formatCount, timeAgo } from "@/lib/format";

// react-globe.gl touches `window`/WebGL, so it must never render on the server.
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-sky-300/60">
      Spinning up the globe…
    </div>
  ),
}) as unknown as ComponentType<Record<string, unknown>>;

const EARTH = "/textures/earth-night.jpg";
const SKY = "/textures/night-sky.png";

export default function GlobeExplorer({
  locations,
}: {
  locations: NewsLocation[];
}) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<NewsLocation | null>(null);

  // Keep the canvas matched to its container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One-time camera + controls setup. Driven by the Globe's onGlobeReady
  // callback, NOT a size effect: react-globe.gl loads lazily via next/dynamic,
  // so the ref isn't populated until the chunk resolves — a size-keyed effect
  // fires too early, finds a null ref, and silently no-ops (no rotation/POV).
  // Keeping it off resize also stops the camera snapping back to default when
  // the viewport changes while a location panel is open.
  function handleGlobeReady() {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = !selected;
    controls.autoRotateSpeed = 0.45;
    controls.enableZoom = true;
    g.pointOfView({ lat: 20, lng: 10, altitude: 2.4 }, 0);
  }

  // Pause auto-rotation while a location panel is open.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate = !selected;
  }, [selected]);

  function focusLocation(loc: NewsLocation) {
    setSelected(loc);
    globeRef.current?.pointOfView(
      { lat: loc.lat, lng: loc.lng, altitude: 1.7 },
      1000,
    );
  }

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="h-[56vh] min-h-[380px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#05070f]"
      >
        {size.w > 0 && (
          <Globe
            ref={globeRef}
            onGlobeReady={handleGlobeReady}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={EARTH}
            backgroundImageUrl={SKY}
            atmosphereColor="#9d8cff"
            atmosphereAltitude={0.24}
            pointsData={locations}
            pointLat="lat"
            pointLng="lng"
            pointColor={() => "#38bdf8"}
            pointAltitude={0.01}
            pointRadius={(d: NewsLocation) =>
              0.35 + Math.min(d.storyCount, 12) * 0.045
            }
            pointLabel={(d: NewsLocation) =>
              `<div style="font-family:system-ui;font-size:12px;color:#e2e8f0;background:rgba(5,7,15,0.9);border:1px solid rgba(56,189,248,0.4);padding:6px 9px;border-radius:8px;">
                 <b>${d.city}</b>, ${d.country}<br/>${d.storyCount} top stories</div>`
            }
            onPointClick={(d: NewsLocation) => focusLocation(d)}
            ringsData={locations}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => (t: number) => `rgba(56,189,248,${1 - t})`}
            ringMaxRadius={2.2}
            ringPropagationSpeed={1.4}
            ringRepeatPeriod={1400}
          />
        )}
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Drag to spin · scroll to zoom · click a glowing marker to read that
        region&apos;s top stories
      </p>

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
  location: NewsLocation;
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
          <span aria-hidden>📈</span> Top {location.storyCount} Most Popular Stories
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
