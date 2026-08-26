// Line-art glyph per expense category (money overhaul). Drawn in the app's own
// hand, no emoji (#148): 14×14 viewBox, currentColor, strokeWidth ~1.2.
import type { ExpenseCategory } from "@/lib/expense-category";

const PATHS: Record<ExpenseCategory, React.ReactNode> = {
  food: (
    <path d="M3.4 1.6v4.2a1.4 1.4 0 0 0 2.8 0V1.6M4.8 1.6v10.8M9.4 1.6c-.9.4-1.4 1.4-1.4 2.8s.5 2 1.4 2.2v5.8" />
  ),
  drinks: <path d="M4 2h6l-.6 4.5a2.4 2.4 0 0 1-4.8 0zM7 9v3M5 12h4" />,
  groceries: (
    <path d="M2 3h1.4l1.2 6.2a1 1 0 0 0 1 .8h4.3a1 1 0 0 0 1-.8L12 5H4M5.5 12.4h.01M10 12.4h.01" />
  ),
  transport: (
    <path d="M2 8.5h10v2.2H2zM3.2 8.5l1-2.6a1 1 0 0 1 .95-.65h3.7a1 1 0 0 1 .95.65l1 2.6M4 10.7v.9M10 10.7v.9" />
  ),
  fuel: (
    <path d="M3 12.4V3a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 1v9.4M2.4 12.4h6.6M8.4 5.6l1.8 1.2v3.4a1.1 1.1 0 0 0 2.2 0V4.4l-1.6-1.6" />
  ),
  flights: (
    <path d="M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z" />
  ),
  lodging: (
    <path d="M2 7L7 3l5 4M3.2 7v4.6h7.6V7M5.6 11.6V9h2.8v2.6" />
  ),
  activity: (
    <path d="M1.5 4.2a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1a1.2 1.2 0 0 0 0 3.6v1a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1a1.2 1.2 0 0 0 0-3.6zM8.4 3.4v7.2" />
  ),
  shopping: (
    <path d="M3 4.5h8l-.7 7a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9zM5 4.5a2 2 0 0 1 4 0" />
  ),
  health: <path d="M7 3v8M3 7h8M4 3.5h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />,
  fees: (
    <path d="M7 2.2c2.6 0 4.8 2.1 4.8 4.8S9.6 11.8 7 11.8 2.2 9.7 2.2 7 4.4 2.2 7 2.2zM8.6 5.2c-.4-.5-1-.7-1.6-.7-1 0-1.5.5-1.5 1.1 0 1.6 3.2.8 3.2 2.4 0 .7-.6 1.2-1.6 1.2-.7 0-1.3-.3-1.7-.8M7 4v6" />
  ),
  other: <path d="M4 2.5h6a.5.5 0 0 1 .5.5v8.4L7 9.3 3.5 11.4V3a.5.5 0 0 1 .5-.5z" />,
};

export function CategoryIcon({
  category,
  size = 18,
  className,
}: {
  category: ExpenseCategory;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[category]}
    </svg>
  );
}
