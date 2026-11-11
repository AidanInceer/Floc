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

export function ExploreIcon({ color }: IconProps) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 14 14" fill="none">
      <Circle
        cx={7}
        cy={7}
        r={5.25}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M1.75 7h10.5M7 1.75c1.6 1.5 2.4 3.25 2.4 5.25S8.6 10.75 7 12.25M7 1.75C5.4 3.25 4.6 5 4.6 7s.8 3.75 2.4 5.25"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Why: Trips — the wordmark's three chevrons, on their own 28×22 box.
 *
 * These are the paths from `wordmark.tsx`, not `flock-chevron.tsx`. The two
 * differ by a vertical flip and mean opposite things: the wordmark is a flock
 * in a V, flying up; the chevron is the product's disclosure caret, pointing
 * down at what it opens. The tab wants the flock.
 */
export function TripsIcon({ color }: IconProps) {
  return (
    <Svg width={(SIZE * 28) / 22} height={SIZE} viewBox="0 0 28 22" fill="none">
      <Path
        d="M3.4 16.5 7 12.9 10.6 16.5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4 10 14 6.4 17.6 10"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.4 16.5 21 12.9 24.6 16.5"
        stroke={color}
        strokeWidth={2.4}
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
