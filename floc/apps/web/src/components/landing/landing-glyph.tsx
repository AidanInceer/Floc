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
  | "train"
  | "plus"
  | "link"
  | "weather"
  | "mail"
  | "receipt"
  | "offline"
  | "keep"
  | "agent"
  | "live"
  | "local"
  | "extension"
  | "stay"
  | "eat"
  | "send"
  | "copy"
  | "grip";

const PATHS: Record<GlyphName, ReactNode> = {
  copy: (
    <>
      <rect x="4.4" y="4.4" width="7.8" height="7.8" rx="1.4" />
      <path d="M9.6 4.4V3a1.2 1.2 0 0 0-1.2-1.2H3A1.2 1.2 0 0 0 1.8 3v5.4A1.2 1.2 0 0 0 3 9.6h1.4" />
    </>
  ),
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
  plus: <path d="M7 2.6v8.8M2.6 7h8.8" />,
  link: (
    <>
      <path d="M6 8a2.6 2.6 0 0 0 3.7 0l2-2a2.6 2.6 0 0 0-3.7-3.7l-.9.9" />
      <path d="M8 6a2.6 2.6 0 0 0-3.7 0l-2 2A2.6 2.6 0 0 0 6 11.7l.9-.9" />
    </>
  ),
  train: (
    <>
      <rect x="3" y="1.8" width="8" height="8.4" rx="1.8" />
      <path d="M3 6.4h8M5 12.2l1-2M9 12.2l-1-2" />
    </>
  ),
  weather: (
    <>
      <circle cx="5.1" cy="4.7" r="2" />
      <path d="M5.1 1.2v.8M5.1 7.4v.8M1.6 4.7h.8M7.8 4.7h.8" />
      <path d="M6.2 11.9a2.4 2.4 0 0 1 .3-4.8 3.1 3.1 0 0 1 5.8 1.2 1.9 1.9 0 0 1-.5 3.6Z" />
    </>
  ),
  mail: (
    <>
      <rect x="1.8" y="3" width="10.4" height="8" rx="1.4" />
      <path d="M2.2 3.6 7 7.6l4.8-4" />
    </>
  ),
  receipt: (
    <>
      <path d="M3 1.8h8v10.4l-1.6-1-1.2 1-1.2-1-1.2 1-1.2-1L3 12.2Z" />
      <path d="M5 5h4M5 7.2h4M5 9.2h2" />
    </>
  ),
  offline: (
    <>
      <path d="M5 5.2a3.4 3.4 0 0 1 5.6 1.5 2.3 2.3 0 0 1-.2 4.5" />
      <path d="M3.3 7.4a2 2 0 0 0 .9 3.8h4.2M2 2l10 10" />
    </>
  ),
  keep: <path d="M3.4 1.8h7.2v10.4L7 9.8l-3.6 2.4Z" />,
  agent: (
    <>
      <path d="M2 3.4a1.4 1.4 0 0 1 1.4-1.4h7.2A1.4 1.4 0 0 1 12 3.4v5a1.4 1.4 0 0 1-1.4 1.4H6.2L3.4 12V9.8A1.4 1.4 0 0 1 2 8.4Z" />
      <path d="M7 4.2l.5 1.2 1.2.5-1.2.5L7 7.6l-.5-1.2-1.2-.5 1.2-.5Z" />
    </>
  ),
  live: (
    <>
      <circle cx="7" cy="7" r="1.6" />
      <path d="M4.2 4.2a4 4 0 0 0 0 5.6M9.8 4.2a4 4 0 0 1 0 5.6M2.6 2.6a6.2 6.2 0 0 0 0 8.8M11.4 2.6a6.2 6.2 0 0 1 0 8.8" />
    </>
  ),
  local: (
    <>
      <circle cx="7" cy="7" r="5.2" />
      <path d="M9.2 4.8 8 8 4.8 9.2 6 6Z" />
    </>
  ),
  extension: (
    <>
      <rect x="1.8" y="2.4" width="10.4" height="9.2" rx="1.4" />
      <path d="M1.8 5h10.4M3.6 3.7h.1M5 3.7h.1M5.2 8.2 6.6 9.4 9 7" />
    </>
  ),
  stay: <path d="M1.8 11.6V3.4M1.8 8.4h10.4v3.2M1.8 6.4h3.4a1.6 1.6 0 0 1 1.6 1.6v.4M8.2 6.2h2.4a1.6 1.6 0 0 1 1.6 1.6v.6" />,
  eat: <path d="M3.6 1.8v4.4a1.4 1.4 0 0 0 2.8 0V1.8M5 6.6v5.6M10.2 12.2V1.8c-1.4.6-2.2 2.2-2.2 4.2 0 1.2.6 1.8 2.2 1.8" />,
  send: <path d="M7 11.6V2.6M3.2 6.2 7 2.4l3.8 3.8" />,
  grip: <path d="M5.4 4.4 3 7l2.4 2.6M8.6 4.4 11 7l-2.4 2.6" />,
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
