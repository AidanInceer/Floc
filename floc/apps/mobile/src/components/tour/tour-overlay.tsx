/**
 * The first-trip tour on the phone (#315). One view at a time is lit; the rest
 * is dimmed with ink in four bands, because a view cannot cut a hole in another.
 */
import { tourStep, tourStopsFor, type TourStop } from "@floc/core/trip/tour";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, useWindowDimensions, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body, Button, Label } from "../system/ui";
import { useTour } from "./tour-context";
import { radius, space } from "@/lib/theme";

type Rect = { x: number; y: number; width: number; height: number };

const PAD = 6;
/** Why: long enough for the rail to finish scrolling before it is measured. */
const SETTLE_MS = 350;

function useStopRect(stop: TourStop | null): Rect | null {
  const tour = useTour();
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    tour?.setActive(stop?.key ?? null);
    setRect(null);
    if (!stop) return;
    const timer = setTimeout(() => {
      tour?.targets.current?.get(stop.key)?.measureInWindow((x, y, width, height) =>
        setRect({ x: x - PAD, y: y - PAD, width: width + PAD * 2, height: height + PAD * 2 }),
      );
    }, SETTLE_MS);
    return () => clearTimeout(timer);
    // Why: `tour` changes identity with `active`, so following it would loop.
  }, [stop]);

  return rect;
}

function Dim({ rect }: { rect: Rect | null }) {
  const { c } = useTheme();
  const { width, height } = useWindowDimensions();
  const band = { position: "absolute" as const, backgroundColor: c.ink, opacity: 0.45 };
  if (!rect) return <View style={[StyleSheet.absoluteFill, band]} />;
  const bottom = rect.y + rect.height;
  const right = rect.x + rect.width;
  return (
    <>
      <View style={[band, { top: 0, left: 0, width, height: Math.max(0, rect.y) }]} />
      <View style={[band, { top: bottom, left: 0, width, height: Math.max(0, height - bottom) }]} />
      <View style={[band, { top: rect.y, left: 0, width: Math.max(0, rect.x), height: rect.height }]} />
      <View style={[band, { top: rect.y, left: right, width: Math.max(0, width - right), height: rect.height }]} />
      <View
        style={{
          position: "absolute",
          top: rect.y,
          left: rect.x,
          width: rect.width,
          height: rect.height,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor: c.pen,
        }}
      />
    </>
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
