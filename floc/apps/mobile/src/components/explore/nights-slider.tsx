import { useRef, useState } from "react";
import { PanResponder, View } from "react-native";

import { useTheme } from "../system/theme";

const THUMB = 24;
const TRACK = 4;

// Why: a JS slider, not @react-native-community/slider — a native module means a
// rebuild of every dev client for one control.
export function NightsSlider({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (next: number) => void;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const latest = useRef({ width, value, onChange });
  latest.current = { width, value, onChange };

  const pick = (x: number) => {
    const { width: w, value: v, onChange: change } = latest.current;
    if (w <= 0) return;
    const ratio = Math.min(Math.max(x / w, 0), 1);
    const next = Math.round(min + ratio * (max - min));
    if (next !== v) change(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
      onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
    }),
  ).current;

  const left = width > 0 ? ((value - min) / (max - min)) * width : 0;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === "increment" ? 1 : -1;
        onChange(Math.min(Math.max(value + step, min), max));
      }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: THUMB + 8, justifyContent: "center" }}
      {...pan.panHandlers}
    >
      <View pointerEvents="none" style={{ height: TRACK, borderRadius: TRACK, backgroundColor: c["rule-2"] }}>
        <View style={{ width: left, height: TRACK, borderRadius: TRACK, backgroundColor: c.pen }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: left - THUMB / 2,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: c.pen,
          borderWidth: 3,
          borderColor: c.sheet,
        }}
      />
    </View>
  );
}
