/**
 * The expense category glyphs, drawn (money overhaul, #148).
 *
 * THE SAME TWELVE DRAWINGS AS THE WEB. Every path is copied from
 * `components/category-icon.tsx` in the web app, unchanged, on the same 14×14
 * viewBox at the same 1.2 weight. That is deliberate: a fork's worth of
 * hand-redrawn icons is how two clients stop looking like one product, and
 * these are the app's own hand, not an icon set.
 *
 * NO EMOJI (#148). Line art, `fill="none"`, `currentColor`.
 *
 * A GLYPH IS NEVER ALONE (#204). Every place that draws one puts the category
 * word beside it — the drawing is the scanning aid, the word is the meaning.
 */
import { CATEGORY_LABELS, type ExpenseCategory } from "@floc/core/expense-category";
import Svg, { Path } from "react-native-svg";

const PATHS: Record<ExpenseCategory, string> = {
  food: "M3.4 1.6v4.2a1.4 1.4 0 0 0 2.8 0V1.6M4.8 1.6v10.8M9.4 1.6c-.9.4-1.4 1.4-1.4 2.8s.5 2 1.4 2.2v5.8",
  drinks: "M4 2h6l-.6 4.5a2.4 2.4 0 0 1-4.8 0zM7 9v3M5 12h4",
  groceries:
    "M2 3h1.4l1.2 6.2a1 1 0 0 0 1 .8h4.3a1 1 0 0 0 1-.8L12 5H4M5.5 12.4h.01M10 12.4h.01",
  transport:
    "M2 8.5h10v2.2H2zM3.2 8.5l1-2.6a1 1 0 0 1 .95-.65h3.7a1 1 0 0 1 .95.65l1 2.6M4 10.7v.9M10 10.7v.9",
  fuel: "M3 12.4V3a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 1v9.4M2.4 12.4h6.6M8.4 5.6l1.8 1.2v3.4a1.1 1.1 0 0 0 2.2 0V4.4l-1.6-1.6",
  flights:
    "M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z",
  lodging: "M2 7L7 3l5 4M3.2 7v4.6h7.6V7M5.6 11.6V9h2.8v2.6",
  activity:
    "M1.5 4.2a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1a1.2 1.2 0 0 0 0 3.6v1a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1a1.2 1.2 0 0 0 0-3.6zM8.4 3.4v7.2",
  shopping: "M3 4.5h8l-.7 7a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9zM5 4.5a2 2 0 0 1 4 0",
  health:
    "M7 3v8M3 7h8M4 3.5h6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z",
  fees: "M7 2.2c2.6 0 4.8 2.1 4.8 4.8S9.6 11.8 7 11.8 2.2 9.7 2.2 7 4.4 2.2 7 2.2zM8.6 5.2c-.4-.5-1-.7-1.6-.7-1 0-1.5.5-1.5 1.1 0 1.6 3.2.8 3.2 2.4 0 .7-.6 1.2-1.6 1.2-.7 0-1.3-.3-1.7-.8M7 4v6",
  other: "M4 2.5h6a.5.5 0 0 1 .5.5v8.4L7 9.3 3.5 11.4V3a.5.5 0 0 1 .5-.5z",
};

export function CategoryIcon({
  category,
  color,
  size = 18,
}: {
  category: ExpenseCategory;
  color: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      // Said aloud, because a row that shows only the glyph would otherwise
      // announce the amount with no idea what it was for.
      accessibilityLabel={CATEGORY_LABELS[category]}
    >
      <Path
        d={PATHS[category]}
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
