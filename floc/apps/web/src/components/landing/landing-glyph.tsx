import type { ReactNode } from "react";

// ── icons ────────────────────────────────────────────────────────────────
// Line-art in the app's own hand (CLAUDE.md: no emoji, no icon fonts). 14×14
// viewBox, fill none, currentColor, hairline stroke.
export type GlyphName =
  | "dates"
  | "money"
  | "star"
  | "check"
  | "app"
  | "packing"
  | "notes"
  | "files"
  | "flight"
  | "pin"
  | "arrow"
  | "train";

const PATHS: Record<GlyphName, ReactNode> = {
  dates: (
    <>
      <rect x="1.8" y="2.8" width="10.4" height="9.4" rx="1.6" />
      <path d="M1.8 5.4h10.4M4.4 1.6v2.4M9.6 1.6v2.4" />
    </>
  ),
  money: (
    <>
      <circle cx="7" cy="7" r="5.2" />
      <path d="M8.6 5.2c-.4-.6-1-.9-1.7-.9-1 0-1.7.5-1.7 1.3 0 1.9 3.6.9 3.6 2.9 0 .8-.8 1.4-1.9 1.4-.8 0-1.5-.3-1.9-1M7 3.4v7.2" />
    </>
  ),
  star: (
    <path d="M7 1.8l1.5 3.4 3.7.3-2.8 2.4.9 3.6L7 9.9 3.7 11.5l.9-3.6L1.8 5.5l3.7-.3Z" />
  ),
  check: (
    <path d="M2.6 7.4 5.6 10.4 11.4 4" />
  ),
  app: (
    <>
      <rect x="3.4" y="1.6" width="7.2" height="10.8" rx="1.6" />
      <path d="M5.8 10.6h2.4" />
    </>
  ),
  packing: (
    <>
      <rect x="1.8" y="4.4" width="10.4" height="7.8" rx="1.4" />
      <path d="M5 4.4V3.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2M7 6.8v3" />
    </>
  ),
  notes: (
    <>
      <path d="M3.2 1.8h5l2.6 2.6v7.8H3.2Z" />
      <path d="M8 1.8v2.8h2.8M5 7.4h4M5 9.4h2.6" />
    </>
  ),
  files: (
    <>
      <path d="M1.8 4.2v6.4a1.2 1.2 0 0 0 1.2 1.2h8a1.2 1.2 0 0 0 1.2-1.2V5.4a1.2 1.2 0 0 0-1.2-1.2H6.9L5.7 2.6H3a1.2 1.2 0 0 0-1.2 1.2Z" />
    </>
  ),
  flight: (
    <>
      <path d="M12.4 2.4 6.2 8.6M12.4 2.4l-4 9.8-2.2-3.6-3.6-2.2Z" />
    </>
  ),
  pin: (
    <>
      <path d="M7 12.4S2.8 8.6 2.8 5.8a4.2 4.2 0 0 1 8.4 0c0 2.8-4.2 6.6-4.2 6.6Z" />
      <circle cx="7" cy="5.7" r="1.4" />
    </>
  ),
  arrow: <path d="M2.4 7h9.2M8 3.4 11.6 7 8 10.6" />,
  train: (
    <>
      <rect x="3" y="1.8" width="8" height="8.4" rx="1.8" />
      <path d="M3 6.4h8M5 12.2l1-2M9 12.2l-1-2" />
    </>
  ),
};

export function Glyph({
  name,
  className,
}: {
  name: GlyphName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
