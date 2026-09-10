/**
 * The travel-mode glyph set, drawn from the web app's own paths (ticket 78).
 *
 * THE SAME DRAWINGS, NOT A SECOND SET. These `d` strings are copied from
 * `travel-mode-icon.tsx` rather than redrawn, because a ferry that is a
 * different ferry on the phone is two design systems wearing one name. The
 * paths are the only thing shared — the web renders them through `svg`, this
 * through `react-native-svg`, and neither imports the other.
 *
 * `other` HAS NO DRAWING ON PURPOSE. It is what someone picks when none of the
 * four fit, so a picture would be a guess. Callers fall back to the word,
 * which they carry anyway — shape is never the only signal.
 */
import type { TransportType } from "@floc/core/vocabulary";
import Svg, { Path } from "react-native-svg";

const PATHS: Partial<Record<TransportType, string[]>> = {
  flight: ["M1.5 8.2 12.5 3 9.9 9.2l-2.2.6-1.5 2.7-1-2.4-3.7-1.9Z"],
  train: [
    "M3.5 1.5h7a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1-1Z",
    "M2.5 5h9",
    "M4.5 12.5 6 9m4 3.5L8.5 9",
  ],
  car: [
    "M1.8 10.5V7.4l1.6-3.2a1 1 0 0 1 .9-.55h5.4a1 1 0 0 1 .9.55l1.6 3.2v3.1Z",
    "M1.8 7.4h10.4",
    "M4 10.5v1.3M10 10.5v1.3",
  ],
  ferry: [
    "M2.6 6.7 7 5.2l4.4 1.5-1.3 3.6H3.9Z",
    "M7 5.2V1.8",
    "M1.5 11.6c1.2 0 1.2 .9 2.4 .9s1.2-.9 2.4-.9 1.2 .9 2.4 .9 1.2-.9 2.4-.9",
  ],
};

export function TravelModeGlyph({
  mode,
  color,
  size = 20,
}: {
  mode: TransportType;
  color: string;
  size?: number;
}) {
  const paths = PATHS[mode];
  if (!paths) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {paths.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={1.15}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
