/**
 * The first-trip tour on the phone (#315). One view at a time is lit; the rest
 * is dimmed with ink in four bands, because a view cannot cut a hole in another.
 */
import { tourStep, tourStopsFor, type TourStop } from "@floc/core/trip/tour";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../system/theme";
import { Body, Button, Label } from "../system/ui";
import { useTour } from "./tour-context";
import { radius, space } from "@/lib/theme";

type Rect = { x: number; y: number; width: number; height: number };

const PAD_X = 12;
const PAD_Y = 8;
/** Why: long enough for the rail to finish scrolling before it is measured. */
const SETTLE_MS = 350;

function useStopRect(stop: TourStop | null): Rect | null {
  const tour = useTour();
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    tour?.setActive(stop?.key ?? null);
    if (!stop) return;
    // Why: the last stop's box is held until the new one is measured, so the card does not jump.
    const timer = setTimeout(() => {
      tour?.targets.current?.get(stop.key)?.measureInWindow((x, y, width, height) =>
        setRect({
          x: x - PAD_X,
          y: y - PAD_Y,
          width: width + PAD_X * 2,
          height: height + PAD_Y * 2,
        }),
      );
    }, SETTLE_MS);
    return () => clearTimeout(timer);
    // Why: `tour` changes identity with `active`, so following it would loop.
  }, [stop]);

  return rect;
}

/** A short control gets a pill, a panel gets the panel's own corner. */
function cornerOf(rect: Rect): number {
  return rect.height < 64 ? rect.height / 2 : radius.lg;
}

function holePath(rect: Rect): string {
  const r = cornerOf(rect);
  const { x, y, width: w, height: h } = rect;
  return (
    `M${x + r},${y}h${w - r * 2}a${r},${r} 0 0 1 ${r},${r}` +
    `v${h - r * 2}a${r},${r} 0 0 1 ${-r},${r}` +
    `h${-(w - r * 2)}a${r},${r} 0 0 1 ${-r},${-r}` +
    `v${-(h - r * 2)}a${r},${r} 0 0 1 ${r},${-r}z`
  );
}

/** Why: a view cannot cut a hole in another, so the dim is one SVG with the lit box taken out. */
function Dim({ rect }: { rect: Rect | null }) {
  const { c } = useTheme();
  const { width, height } = useWindowDimensions();
  if (!rect) {
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: c.ink, opacity: 0.45 }]}
      />
    );
  }
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Path
        d={`M0,0h${width}v${height}h${-width}z ${holePath(rect)}`}
        fill={c.ink}
        fillOpacity={0.45}
        fillRule="evenodd"
      />
      <Path d={holePath(rect)} fill="none" stroke={c.pen} strokeWidth={2} />
    </Svg>
  );
}

export function TourOverlay({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const { height } = useWindowDimensions();
  const tour = useTour();
  const [stops, setStops] = useState<TourStop[] | null>(null);
  const [state, setState] = useState({ index: 0, done: false });

  // Why: waits a beat so Overview has drawn — the nudge is a stop only if it is there.
  useEffect(() => {
    const timer = setTimeout(() => {
      setStops(tourStopsFor({ hasNudge: tour?.targets.current?.has("nudge") ?? false, hasFiles: true }));
    }, SETTLE_MS * 2);
    return () => clearTimeout(timer);
  }, []);

  const stop = stops && !state.done ? stops[state.index] : null;
  const rect = useStopRect(stop);

  if (!stops || !stop) return null;

  const move = (to: "next" | "back" | "skip") => {
    const next = tourStep(state, to, stops.length);
    setState(next);
    if (next.done) {
      tour?.setActive(null);
      onDone();
    }
  };

  const below = rect ? rect.y + rect.height + space.md : height / 3;
  const cardTop = below + 200 < height ? below : Math.max(space.lg, (rect?.y ?? height) - 200 - space.md);

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={() => move("skip")}>
      <Dim rect={rect} />
      <View
        style={{
          position: "absolute",
          top: cardTop,
          left: space.lg,
          right: space.lg,
          backgroundColor: c.sheet,
          borderRadius: radius.lg,
          padding: space.lg,
          gap: space.sm,
        }}
      >
        <Label>{`${state.index + 1} of ${stops.length}`}</Label>
        <Body bold>{stop.title}</Body>
        <Body tone="ink-2">{stop.line}</Body>
        <View style={{ flexDirection: "row", gap: space.sm, paddingTop: space.sm }}>
          <Button label="Skip" variant="quiet" fit="small" onPress={() => move("skip")} />
          <View style={{ flex: 1 }} />
          {state.index > 0 ? (
            <Button label="Back" variant="quiet" fit="small" onPress={() => move("back")} />
          ) : null}
          <Button
            label={state.index === stops.length - 1 ? "Done" : "Next"}
            fit="small"
            onPress={() => move("next")}
          />
        </View>
      </View>
    </Modal>
  );
}
