import type { SVGProps } from "react";

// One stroked icon set so the UI stops leaning on emoji, which render
// differently on every OS and read as amateur next to a real news product.
// 1.7 stroke on a 24 grid matches the header's existing glyphs.
export type IconName =
  | "search"
  | "bell"
  | "globe"
  | "pin"
  | "eye"
  | "flame"
  | "bookmark"
  | "bookmark-filled"
  | "share"
  | "up"
  | "down"
  | "comment"
  | "chart"
  | "clock"
  | "heart"
  | "sparkle"
  | "check"
  | "close"
  | "info"
  | "newspaper"
  | "star"
  | "landmark"
  | "briefcase"
  | "cpu"
  | "film"
  | "pulse"
  | "trophy"
  | "users";

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3.5 9h17M3.5 15h17" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  flame: <path d="M12 3s5 4.3 5 9a5 5 0 0 1-10 0c0-1.6.7-2.9 1.6-3.9C9.3 9.9 10 11 10 11s-.5-4.7 2-8Z" />,
  bookmark: <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z" />,
  "bookmark-filled": (
    <path
      d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z"
      fill="currentColor"
    />
  ),
  share: (
    <>
      <path d="M12 15V4" />
      <path d="m8 7.5 4-4 4 4" />
      <path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" />
    </>
  ),
  up: <path d="M12 19V5m0 0-6.5 6.5M12 5l6.5 6.5" />,
  down: <path d="M12 5v14m0 0 6.5-6.5M12 19l-6.5-6.5" />,
  comment: (
    <path d="M20.5 12.5c0 4-3.8 7-8.5 7a10 10 0 0 1-2.6-.34L4 21l1.2-3.7A6.7 6.7 0 0 1 3.5 12.5c0-4 3.8-7 8.5-7s8.5 3 8.5 7Z" />
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 3.1C19.5 15.4 12 20 12 20Z" />
  ),
  sparkle: (
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.7v.1" />
    </>
  ),
  newspaper: (
    <>
      <path d="M3.5 5.5h13a1 1 0 0 1 1 1v12H4.5a1 1 0 0 1-1-1v-12Z" />
      <path d="M17.5 9.5H20a.5.5 0 0 1 .5.5v7a1.5 1.5 0 0 1-3 0" />
      <path d="M6.5 9h7M6.5 12.5h7M6.5 16h4" />
    </>
  ),
  star: (
    <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8L12 3.8Z" />
  ),
  landmark: (
    <>
      <path d="M3.5 9.5 12 4l8.5 5.5" />
      <path d="M6 11v6M10 11v6M14 11v6M18 11v6" />
      <path d="M3.5 20.5h17" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3 12.5h18" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M7.5 5v14M16.5 5v14M3 12h18" />
    </>
  ),
  pulse: <path d="M3 12.5h4l2.5-6 4 12L16 12.5h5" />,
  trophy: (
    <>
      <path d="M7.5 4.5h9v5a4.5 4.5 0 0 1-9 0v-5Z" />
      <path d="M7.5 6H5a2 2 0 0 0 2.5 2M16.5 6H19a2 2 0 0 1-2.5 2" />
      <path d="M12 14v3.5M9 20.5h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.7a3.2 3.2 0 0 1 0 5.6M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
    </>
  ),
};

export default function Icon({
  name,
  size = 16,
  className,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

// Category identity as line icons rather than emoji.
export const CATEGORY_ICON: Record<string, IconName> = {
  politics: "landmark",
  business: "briefcase",
  technology: "cpu",
  entertainment: "film",
  health: "pulse",
  sports: "trophy",
  world: "globe",
};
