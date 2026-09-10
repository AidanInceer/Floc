/**
 * The bottom bar's three marks (ticket 302 revisited).
 *
 * WHY THESE EXIST NOW. #299 and #302 chose words because React Native had no
 * SVG here and three nouns beat three bad drawings. `react-native-svg` closes
 * that gap, so the bar can carry the same line-art the web app does: 14×14
 * `viewBox`, `fill="none"`, `strokeWidth` 1.2, colour from the caller (#148
 * still forbids the emoji this would otherwise be).
 *
 * The word stays under each mark — a glyph nobody has learnt yet is a puzzle,
 * and the label is what the screen reader reads.
 *
 * TRIPS IS THE WORDMARK. The flock chevron is the product's own mark, so the
 * tab that holds the trips is the only one that gets it. Traced from the web
 * app's `flock-chevron.tsx` on its native 26×20 box, scaled to sit level with
 * the two 14×14 marks beside it.
 */
import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const SIZE = 22;
const STROKE = 1.2;

type IconProps = { color: ColorValue };

/** Explore — a magnifier. */
export function ExploreIcon({ color }: IconProps) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 14 14" fill="none">
      <Circle
        cx={6}
        cy={6}
        r={4}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M9 9 12.2 12.2"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Trips — the wordmark's three chevrons, on their own 26×20 box.
 *
 * These are the paths from `wordmark.tsx`, not `flock-chevron.tsx`. The two
 * differ by a vertical flip and mean opposite things: the wordmark is a flock
 * in a V, flying up; the chevron is the product's disclosure caret, pointing
 * down at what it opens. The tab wants the flock.
 */
export function TripsIcon({ color }: IconProps) {
  return (
    <Svg width={(SIZE * 26) / 20} height={SIZE} viewBox="0 0 26 20" fill="none">
      <Path
        d="M3 14 6.5 10.5 10 14"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 8.5 13 5 16.5 8.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 14 19.5 10.5 23 14"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** You — a head over shoulders. */
export function YouIcon({ color }: IconProps) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={4.6} r={2.4} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M2.4 12.2c0-2.3 2.1-3.7 4.6-3.7s4.6 1.4 4.6 3.7"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}
