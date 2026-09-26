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
  overview: <path d="M2 3h10v8H2zM2 9l3-2.6 2.4 2 2-1.5L12 9.4" />,
  dates: <path d="M2.2 3.4h9.6v8.4H2.2zM2.2 6h9.6M4.8 2v2.4M9.2 2v2.4" />,
  days: (
    <>
      <circle cx="3.4" cy="3.6" r="1.2" />
      <circle cx="10.6" cy="10.4" r="1.2" />
      <path d="M4.6 3.6h4.6a1.7 1.7 0 0 1 0 3.4H4.8a1.7 1.7 0 0 0 0 3.4h4.6" />
    </>
  ),
  money: (
    <>
      <circle cx="7" cy="7" r="5" />
      <path d="M8.6 4.6a1.8 1.8 0 0 0-3.1 1.2v3.6H4.6M4.6 7.4h3M5.5 9.4h4" />
    </>
  ),
  packing: <path d="M3.2 4.6h7.6l-.6 7.4H3.8zM5.2 4.6V3.4a1.8 1.8 0 0 1 3.6 0v1.2" />,
  notes: <path d="M3 1.8h5.4L11 4.4v7.8H3zM8.2 1.8v2.8H11M5 7h4M5 9.4h3" />,
  files: <path d="M1.8 3.2h3.6l1.2 1.4h5.6v7H1.8z" />,
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
