// One line glyph per file category, so a file chip says what it is before its name does.
import type { DocCategory } from "@floc/core/documents/documents";

const PATHS: Record<DocCategory, string[]> = {
  travel: ["M1.5 8.2 12.5 3 9.9 9.2l-2.2.6-1.5 2.7-1-2.4-3.7-1.9Z"],
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
