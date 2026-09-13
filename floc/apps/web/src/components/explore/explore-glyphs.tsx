const glyph = {
  width: 13,
  height: 13,
  viewBox: "0 0 14 14",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function PinGlyph() {
  return (
    <svg {...glyph}>
      <path d="M7 12.5s4-3.6 4-7a4 4 0 0 0-8 0c0 3.4 4 7 4 7Z" />
      <circle cx="7" cy="5.5" r="1.4" />
    </svg>
  );
}

export function HeartGlyph() {
  return (
    <svg {...glyph}>
      <path d="M7 11.8S2 8.8 2 5.3A2.6 2.6 0 0 1 7 4a2.6 2.6 0 0 1 5 1.3c0 3.5-5 6.5-5 6.5Z" />
    </svg>
  );
}

export function TickGlyph() {
  return (
    <svg {...glyph}>
      <path d="m3 7.3 2.6 2.5L11 4.2" />
    </svg>
  );
}

export function ArrowGlyph() {
  return (
    <svg {...glyph}>
      <path d="M3 7h8M8 4l3 3-3 3" />
    </svg>
  );
}
