import { useRef, useState, type ReactNode } from "react";
import { PanResponder, View } from "react-native";

import { useTheme } from "../../system/theme";
import { space } from "@/lib/theme";

const THUMB = 24;
const TRACK = 2;

export type Bar = { count: number; on: boolean };
type Bounds = { min: number; max: number; step: number };

const snap = (v: number, { min, max, step }: Bounds) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));

// Why: a JS slider, not @react-native-community/slider — a native module means a rebuild of every dev
// client, and that slider has one thumb. A touch moves whichever thumb is nearer.
export function RangeBars({
  label,
  bars,
  bounds,
  value,
  onChange,
  children,
}: {
  label: string;
  bars: Bar[];
  bounds: Bounds;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  /** The line under the thumbs. */
  children: ReactNode;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  // Why: the pan handlers are made once, so they read the newest props through this ref (the price scale changes with its unit).
  const latest = useRef({ width, value, bounds, onChange });
  latest.current = { width, value, bounds, onChange };
  const held = useRef<0 | 1>(0);
  const span = bounds.max - bounds.min;

  const move = (x: number, grab: boolean) => {
    const { width: w, value: [lo, hi], bounds: b, onChange: change } = latest.current;
    const v = b.min + (Math.min(Math.max(x - THUMB / 2, 0), w) / Math.max(w, 1)) * (b.max - b.min);
    if (grab) held.current = Math.abs(v - lo) <= Math.abs(v - hi) && !(lo === hi && v > hi) ? 0 : 1;
    const next = snap(v, b);
    const pair: [number, number] = held.current === 0 ? [Math.min(next, hi), hi] : [lo, Math.max(next, lo)];
    if (pair[0] !== lo || pair[1] !== hi) change(pair);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => move(e.nativeEvent.locationX, true),
      onPanResponderMove: (e) => move(e.nativeEvent.locationX, false),
    }),
  ).current;

  const most = Math.max(1, ...bars.map((b) => b.count));
  const left = (v: number) => ((v - bounds.min) / span) * width;
  const thumb = (i: 0 | 1) => {
    const v = value[i];
    const nudge = (by: number) => onChange(i === 0 ? [Math.min(snap(v + by, bounds), value[1]), value[1]] : [value[0], Math.max(snap(v + by, bounds), value[0])]);
    return (
      <View
        accessible
        // Why: a touch on a thumb would report its x inside the thumb; the track takes every touch.
        pointerEvents="none"
        accessibilityRole="adjustable"
        accessibilityLabel={`${label}, ${i === 0 ? "from" : "to"}`}
        accessibilityValue={{ min: bounds.min, max: bounds.max, now: v }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === "increment" ? bounds.step : -bounds.step)}
        style={{
          position: "absolute",
          left: left(v),
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: c.sheet,
          borderWidth: 1.5,
          borderColor: c.ink,
        }}
      />
    );
  };

  return (
    // Why: Android's back gesture owns the screen's edge; a thumb under it closed the sheet instead of moving.
    <View style={{ gap: space.sm, marginHorizontal: space.lg }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 46, paddingHorizontal: THUMB / 2 }}>
        {bars.map((b, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: b.count ? `${8 + (b.count / most) * 92}%` : 0,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              backgroundColor: b.on ? c["ink-3"] : c.rule,
            }}
          />
        ))}
      </View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width - THUMB)}
        style={{ height: THUMB + 8, marginTop: -space.md, justifyContent: "center" }}
        {...pan.panHandlers}
      >
        <View pointerEvents="none" style={{ marginHorizontal: THUMB / 2, height: TRACK, backgroundColor: c["rule-2"] }} />
        {thumb(0)}
        {thumb(1)}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>{children}</View>
    </View>
  );
}
