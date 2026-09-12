/**
 * Roster seats, drawn (tickets 291, 299).
 *
 * NO EMOJI (#148). The web app draws line-art in a 14×14 `viewBox` at ~13px,
 * `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"`. React Native
 * has no SVG without another dependency, so this is the same drawing built
 * from views, at the same weight.
 *
 * The tab glyphs that lived here went with the tab bar (#299) — the section
 * sheet is a list of words, and a word needs no icon beside it.
*/
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

import { fonts } from "@/lib/theme";

/** A member's seat colour as a filled disc with their initial — the roster's `whoTone` made visible. */
export function Seat({
  initial,
  ground,
  ink,
}: {
  initial: string;
  ground: string;
  ink: string;
}) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: ground,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: ink,
      }}
    >
      <Text style={{ color: ink, fontFamily: fonts.sansBold, fontSize: 12 }}>{initial}</Text>
    </View>
  );
}

/* Real SVG now that `react-native-svg` is here (#302) — same weights as the web. */

const STROKE = 1.2;

/** A tick. Packed, done, claimed. */
export function TickGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path
        d="M2.6 7.4 5.6 10.4 11.4 4"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A cross. Remove, drop, undo a claim. */
export function CrossGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.6 3.6 10.4 10.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M10.4 3.6 3.6 10.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** A hand raised: I'll bring it. A circle with a line up out of it. */
export function ClaimGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M7 10.6V3.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M4.2 6.2 7 3.4 9.8 6.2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** A plus. One more of something. */
export function PlusGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M7 3.2V10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M3.2 7H10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** A minus. One fewer. */
export function MinusGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.2 7H10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** A chevron pointing down: "this opens". */
export function ChevronGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.4 5.4 7 9l3.6-3.6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * The wordmark's three chevrons, the product's one disclosure mark — the same
 * paths as the web app's `flock-chevron.tsx`, on its native 26×20 box. Points
 * down closed; callers flip it for the open state.
 */
export function FlockChevronGlyph({ color, open }: { color: string; open?: boolean }) {
  return (
    <Svg
      width={16}
      height={13}
      viewBox="0 0 26 20"
      fill="none"
      style={open ? { transform: [{ rotate: "180deg" }] } : undefined}
    >
      <Path d="M3 6 6.5 9.5 10 6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.5 11.5 13 15 16.5 11.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 6 19.5 9.5 23 6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * A pen. "This is a control, not a caption" — it sits beside the trip name in
 * the header, which opens the trip's name, colour and tags. Without it the
 * title read as a heading and nobody tapped it.
 */
export function PenGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M9.3 2.6l2.1 2.1-6 6-2.6.5.5-2.6 6-6z" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Want-to-go: a pin planted, not a star. A star would read as a rating, and
 * nobody rates a country they have never been to.
 */
export function FlagGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3.5 12.5V2.2c2-1 4 1 6 0v5c-2 1-4-1-6 0"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Three dots: "there is more to this than the line shows". The web trip card
 * wears the same mark, so the phone borrows it rather than inventing a word.
 */
export function MoreGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Circle cx={3.2} cy={7} r={1} fill={color} />
      <Circle cx={7} cy={7} r={1} fill={color} />
      <Circle cx={10.8} cy={7} r={1} fill={color} />
    </Svg>
  );
}

/**
 * Share: a box with an arrow leaving it. Not a chain link — a link is the
 * thing being handed over, and drawing the thing rather than the act read as
 * "attachment" in testing.
 */
export function ShareGlyph({ color }: { color: string }) {
  // The web's share mark (`trip-roster.tsx`): three nodes on two lines. Same
  // drawing on both, so "share" is one picture, not two.
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Circle cx={10.5} cy={2.9} r={1.75} stroke={color} strokeWidth={1.2} />
      <Circle cx={3.5} cy={7} r={1.75} stroke={color} strokeWidth={1.2} />
      <Circle cx={10.5} cy={11.1} r={1.75} stroke={color} strokeWidth={1.2} />
      <Path
        d="M5 7.9l4 2.3M9 3.8L5 6.1"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * A paperclip: this block has files on it (ticket 324). The same path the web
 * draws, so a clipped event is one picture across both apps.
 */
export function ClipGlyph({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 14 14" fill="none">
      <Path
        d="M10.5 6.5 6 11a2.6 2.6 0 0 1-3.7-3.7l5.2-5.2a1.7 1.7 0 0 1 2.4 2.4L4.7 9.7a.8.8 0 0 1-1.2-1.2l4.6-4.6"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const HEART =
  "M7 12.1C3.3 9.4 1.5 7.5 1.5 5.4A3.2 3.2 0 0 1 7 3.5a3.2 3.2 0 0 1 5.5 1.9c0 2.1-1.8 4-5.5 6.7Z";
const THUMB = [
  "M4.3 6.1 6.9 1.5a1.35 1.35 0 0 1 2 1.25V5.5h2.9a1.2 1.2 0 0 1 1.16 1.53l-1.1 3.85A1.5 1.5 0 0 1 10.4 12H4.3Z",
  "M1.3 6.1h2.4V12H1.3Z",
];

/**
 * Heart, thumbs up, thumbs down — the same paths the web's `ReactionGlyph`
 * draws (ticket 36), so one reaction is one picture on both surfaces. Yours
 * fills in; the count beside it is what carries the state, never the fill
 * alone (#204).
 */
export function ReactionGlyph({
  kind,
  mine,
  color,
}: {
  kind: "heart" | "up" | "down";
  mine: boolean;
  color: string;
}) {
  const paths = kind === "heart" ? [HEART] : THUMB;
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14">
      {/* Thumbs down is thumbs up, turned over. */}
      <G transform={kind === "down" ? "rotate(180 7 7)" : undefined}>
        {paths.map((d) => (
          <Path
            key={d}
            d={d}
            fill={mine ? color : "none"}
            stroke={color}
            strokeWidth={mine ? 0 : 1.25}
            strokeLinejoin="round"
          />
        ))}
      </G>
    </Svg>
  );
}
