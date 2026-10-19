// One line glyph per file category, so a file chip says what it is before its name does.
import type { DocCategory } from "@floc/core/documents/documents";

const PATHS: Record<DocCategory, string[]> = {
  travel: ["M11.03 2.97C11.42 3.36 11.35 3.99 10.85 4.49L8.66 6.68L9.93 11.49L9.09 12.34L6.96 8.38L5.27 10.08L5.48 11.7L4.84 12.34L3.68 10.32L1.66 9.16L2.3 8.52L3.92 8.73L5.62 7.04L1.66 4.91L2.51 4.07L7.32 5.34L9.51 3.15C10.01 2.65 10.64 2.58 11.03 2.97Z"],
  stay: ["M1.8 11.6V3.2M1.8 8.8h10.4v2.8M1.8 6.6h3.6v2.2M5.4 6.6h5a1.8 1.8 0 0 1 1.8 1.8v.4"],
  tickets: ["M1.9 4.2h10.2v1.7a1.1 1.1 0 0 0 0 2.2v1.7H1.9V8.1a1.1 1.1 0 0 0 0-2.2ZM8.6 4.2v5.6"],
  admin: ["M7 1.8 11.2 3.3v3.4c0 2.6-1.8 4.5-4.2 5.5-2.4-1-4.2-2.9-4.2-5.5V3.3Z"],
  other: ["M3.4 1.9h4.8l2.4 2.4v7.8H3.4ZM8.2 1.9v2.4h2.4M5.2 7.3h3.6M5.2 9.4h3.6"],
};

export function DocCategoryIcon({ category, size = 13 }: { category: DocCategory; size?: number }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {PATHS[category].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
