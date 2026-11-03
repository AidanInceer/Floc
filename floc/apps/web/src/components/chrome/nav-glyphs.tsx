const PATHS = {
  explore: (
    <>
      <circle cx="7" cy="7" r="5" />
      <path d="M9.2 4.8 8 8 4.8 9.2 6 6z" />
    </>
  ),
  trips: <path d="M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4M1.6 8h10.8" />,
  friends: (
    <>
      <circle cx="5" cy="5" r="1.9" />
      <path d="M1.6 11.4c.4-1.8 1.7-2.8 3.4-2.8s3 1 3.4 2.8" />
      <circle cx="10" cy="5.6" r="1.5" />
      <path d="M9.4 8.7c1.5 0 2.6.9 3 2.5" />
    </>
  ),
  overview: (
    <path d="M3.6 2h6.8A1.6 1.6 0 0 1 12 3.6v6.8a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 10.4V3.6A1.6 1.6 0 0 1 3.6 2ZM7 2v10M7 7h5" />
  ),
  dates: (
    <path d="M3.4 3h7.2A1.4 1.4 0 0 1 12 4.4v6.4a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 10.8V4.4A1.4 1.4 0 0 1 3.4 3ZM4.8 1.8v2.4M9.2 1.8v2.4M2 6h10" />
  ),
  days: (
    <>
      <circle cx="2.8" cy="3.6" r=".9" />
      <circle cx="2.8" cy="7" r=".9" />
      <circle cx="2.8" cy="10.4" r=".9" />
      <path d="M6 3.6h6M6 7h6M6 10.4h4" />
    </>
  ),
  money: <path d="M3 1.8h8v10.4l-1.3-.9-1.4.9-1.3-.9-1.3.9-1.4-.9-1.3.9ZM5 4.6h4M5 6.6h4" />,
  packing: (
    <path d="M3.8 4.4h6.4a1.4 1.4 0 0 1 1.4 1.4V10a1.4 1.4 0 0 1-1.4 1.4H3.8A1.4 1.4 0 0 1 2.4 10V5.8a1.4 1.4 0 0 1 1.4-1.4ZM5.2 4.4V3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.4M5 4.4v7M9 4.4v7" />
  ),
  notes: <path d="M3 2h5.6L11 4.4V12H3ZM5 7h4M5 9.4h4" />,
  files: (
    <path d="M1.8 4v7a1 1 0 0 0 1 1h8.4a1 1 0 0 0 1-1V5.6a1 1 0 0 0-1-1H6.6L5.4 3H2.8a1 1 0 0 0-1 1ZM1.8 6.6h10.4" />
  ),
};

export type NavGlyphName = keyof typeof PATHS;

export function NavGlyph({ name }: { name: NavGlyphName }) {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="size-[14px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
