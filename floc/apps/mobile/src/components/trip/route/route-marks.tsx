// Why drawn as views over the map: MapLibre has no canvas, so the web's discs, names and tags (`paint-route.ts`) are rebuilt here at the same sizes.
import type { StopRole } from "@floc/core/trip/route/route-lines";
import type { TransportType } from "@floc/core/vocabulary";
import { Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useTheme } from "../../system/theme";
import { TravelModeGlyph } from "../../system/travel-mode-glyph";
import { fonts, radius, size } from "@/lib/theme";

const UNSET = "M5.2 5.3a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.6-.8 1.2v.5M7 10.3v.2";
const OTHER = "M2.4 7h9.2M8 3.4 11.6 7 8 10.6";
const END_R = 9;
const MID_R = 4.4;

/** The start is an ink disc with a play mark (a round trip's too), the end one with a square; a stop between is an open dot. */
export function StopDot({ role }: { role: StopRole }) {
  const { c } = useTheme();
  if (role === "mid") {
    const box = (MID_R + 2) * 2;
    return (
      <Svg width={box} height={box}>
        <Circle cx={box / 2} cy={box / 2} r={MID_R} fill={c.sheet} stroke={c.ink} strokeWidth={1.8} />
      </Svg>
    );
  }
  const box = (END_R + 2) * 2;
  const m = box / 2;
  const r = END_R;
  return (
    <Svg width={box} height={box}>
      <Circle cx={m} cy={m} r={r} fill={c.ink} stroke={c.sheet} strokeWidth={2} />
      {role === "end" ? (
        <Rect x={m - r * 0.36} y={m - r * 0.36} width={r * 0.72} height={r * 0.72} rx={1} fill={c.sheet} />
      ) : (
        <Path d={`M${m - r * 0.24 + 0.6} ${m - r * 0.42}L${m + r * 0.44 + 0.6} ${m}L${m - r * 0.24 + 0.6} ${m + r * 0.42}Z`} fill={c.sheet} />
      )}
    </Svg>
  );
}

/** A stop's name, with its nights under it, haloed in the sheet so it reads over a line. */
export function StopName({ name, nights, side }: { name: string; nights: string | null; side: "left" | "right" }) {
  const { c } = useTheme();
  const halo = { textShadowColor: c.sheet, textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } };
  const align = side === "left" ? "right" : "left";
  return (
    <View pointerEvents="none" style={{ maxWidth: 120 }}>
      <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.display, fontSize: size.small, textAlign: align, ...halo }}>
        {name}
      </Text>
      {nights ? (
        <Text style={{ color: c["ink-2"], fontFamily: fonts.sansItalic, fontSize: size.label, textAlign: align, ...halo }}>{nights}</Text>
      ) : null}
    </View>
  );
}

/** A leg's tag, as the web's: the way the group travels as a mark, or a question mark and "Not set" while nobody has said. */
export function LegTag({ mode, time }: { mode: TransportType | null; time: string }) {
  const { c } = useTheme();
  const drawn = mode && mode !== "other";
  // Why: a leg with no mode has only its words to say so; a set one is its mark alone, as on the web (`markOf`).
  const words = mode ? "" : time;
  return (
    <View
      pointerEvents="none"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        height: 20,
        paddingHorizontal: words ? 7 : 3,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: words ? c["rule-2"] : c.ink,
        backgroundColor: c.sheet,
      }}
    >
      {drawn ? (
        <TravelModeGlyph mode={mode} color={c.ink} size={12} />
      ) : (
        <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
          <Path d={mode ? OTHER : UNSET} stroke={mode ? c.ink : c["ink-2"]} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      {words ? <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{words}</Text> : null}
    </View>
  );
}

/** One arrow on a leg, for the way the trip goes. */
export function LegArrow({ angle }: { angle: number }) {
  const { c } = useTheme();
  return (
    <View pointerEvents="none" style={{ transform: [{ rotate: `${angle}deg` }] }}>
      <Svg width={12} height={12}>
        <Path d="M3.5 2L8.5 6L3.5 10" stroke={c.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}
