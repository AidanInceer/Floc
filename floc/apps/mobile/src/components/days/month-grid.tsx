/**
 * One month of days, painted by dragging a finger (ticket 297).
 *
 * SEVEN COLUMNS, MONDAY FIRST — the grid itself comes from
 * `@floc/core/availability`, so the phone and the web page the same months and
 * pad the same weeks. Nothing about a calendar is recomputed here.
 *
 * WHY THE GESTURE IS ON THE GRID, NOT THE CELLS. A finger dragged quickly
 * crosses cells without either one hearing a touch, which would leave holes in
 * a painted run. So the grid owns the responder, works out which cell is under
 * the finger from its own geometry, and hands the date to `paintRange`, which
 * recomputes the whole span from the anchor every move. The web calendar
 * solved the same problem the same way (#127); this is that fix in a place
 * that has no pointer events.
 *
 * A DAY HAS ONE COLOUR ON EVERY VIEW, from dayMark in core, as on the web:
 * the trip solid green, everyone free pastel green, some free pastel red in
 * three steps. A run of the same mark joins into one shape across a week.
 * Your own day is a disc behind the number. Every day also says all of it in
 * words to a screen reader (#204).
 */
import { WEEKDAY_LABELS, monthGrid, type IsoMonth } from "@floc/core/dates/availability";
import { markKey, weekJoins } from "@floc/core/dates/day-marks";
import { useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import type { DayLook } from "@/lib/dates/day-look";
import { fonts, radius, size } from "@/lib/theme";
import type { TokenName } from "@floc/core/design/tokens";

export type { DayLook };

const FILL: Record<string, { ground: TokenName; ink: TokenName; fade?: number }> = {
  all: { ground: "pastel-green", ink: "pastel-green-ink" },
  "some-1": { ground: "some-free-1", ink: "some-free-ink" },
  "some-2": { ground: "some-free-2", ink: "some-free-ink" },
  "some-3": { ground: "some-free-3", ink: "some-free-ink" },
  trip: { ground: "green", ink: "sheet" },
  pend: { ground: "green", ink: "sheet", fade: 0.55 },
};

const INSET = 3;
const DISC = 30;

type Join = { left: boolean; right: boolean };

/** The day's colour, as one shape that runs into its neighbours of the same mark. */
function Shape({ fill, join }: { fill: (typeof FILL)[string]; join: Join }) {
  const { c } = useTheme();
  const left = join.left ? 0 : radius.md;
  const right = join.right ? 0 : radius.md;
  return (
    <View
      style={{
        position: "absolute",
        top: INSET,
        bottom: INSET,
        left: join.left ? 0 : INSET,
        right: join.right ? 0 : INSET,
        backgroundColor: c[fill.ground],
        opacity: fill.fade ?? 1,
        borderTopLeftRadius: left,
        borderBottomLeftRadius: left,
        borderTopRightRadius: right,
        borderBottomRightRadius: right,
      }}
    />
  );
}

/** You can do it: solid on the trip so it reads on the green, a soft wash elsewhere. */
function Disc({ onTrip, ink }: { onTrip: boolean; ink: string }) {
  const { c } = useTheme();
  return <View style={{ position: "absolute", width: DISC, height: DISC, borderRadius: radius.pill, backgroundColor: onTrip ? c.sheet : ink, opacity: onTrip ? 1 : 0.14 }} />;
}

function decoration(look: DayLook): "line-through" | "underline" | "none" {
  if (look.cut) return "line-through";
  return look.today ? "underline" : "none";
}

/** One day. Drawn only — the gesture belongs to the grid, for the reason above. */
function DayCell({ date, look, join }: { date: string; look: DayLook; join: Join }) {
  const { c } = useTheme();
  const key = markKey(look.mark);
  const fill = FILL[key];
  const onTrip = key === "trip";
  const base = fill ? c[fill.ink] : c.ink;
  const ink = look.mine && onTrip ? c.green : base;
  return (
    <View accessibilityLabel={look.label} style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: look.past ? 0.7 : 1 }}>
      {fill ? <Shape fill={fill} join={join} /> : null}
      {look.mine ? <Disc onTrip={onTrip} ink={base} /> : null}
      <Text
        style={{
          color: ink,
          fontFamily: onTrip || look.mine ? fonts.typeBold : fonts.type,
          fontSize: size.small,
          fontVariant: ["tabular-nums"],
          textDecorationLine: decoration(look),
        }}
      >
        {Number(date.slice(8))}
      </Text>
      {look.hi === undefined ? null : (
        <Text style={{ position: "absolute", top: 4, right: 5, color: ink, opacity: 0.85, fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>
          {`${look.hi}°`}
        </Text>
      )}
    </View>
  );
}
const ROW_HEIGHT = 46;

export function MonthGrid({
  month,
  look,
  onPaint,
  onRelease,
}: {
  month: IsoMonth;
  look: (date: string) => DayLook;
  /** Called with every date the finger has reached, including the first. */
  onPaint: (anchor: string, target: string) => void;
  onRelease: () => void;
}) {
  const { c } = useTheme();
  const weeks = monthGrid(month);
  const [width, setWidth] = useState(0);

  // Refs, not state: the responder closes over these once and must see the
  // live value, not the value at the render that created it.
  const anchor = useRef<string | null>(null);
  const geometry = useRef({ width: 0, weeks });
  geometry.current = { width, weeks };

  // THE SAME TRAP, for the callbacks (#302 follow-up). `PanResponder.create`
  // runs once, so it captured the FIRST render's `onPaint` and kept calling it
  // for the life of the screen — with the first render's `view` and the first
  // render's marks baked in. That is why a tap "did not work most of the
  // time": it worked, against a state three renders old.
  const handlers = useRef({ onPaint, onRelease });
  handlers.current = { onPaint, onRelease };

  /** Which date is under a touch, from the grid's own geometry. Null off the grid or on a pad cell. */
  function dateAt(x: number, y: number): string | null {
    const { width: gridWidth, weeks: rows } = geometry.current;
    if (gridWidth === 0) return null;
    const column = Math.floor(x / (gridWidth / 7));
    const row = Math.floor(y / ROW_HEIGHT);
    if (column < 0 || column > 6 || row < 0 || row >= rows.length) return null;
    return rows[row][column];
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // The grid sits in a ScrollView. Without this the parent can steal the
      // gesture mid-drag and the painted run stops where the scroll began.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const date = dateAt(event.nativeEvent.locationX, event.nativeEvent.locationY);
        if (!date) return;
        anchor.current = date;
        handlers.current.onPaint(date, date);
      },
      onPanResponderMove: (event) => {
        if (!anchor.current) return;
        const date = dateAt(event.nativeEvent.locationX, event.nativeEvent.locationY);
        // Off the grid mid-drag keeps the last good span rather than clearing
        // it — a finger straying over the edge is not a change of mind.
        if (date) handlers.current.onPaint(anchor.current, date);
      },
      onPanResponderRelease: () => {
        anchor.current = null;
        handlers.current.onRelease();
      },
      onPanResponderTerminate: () => {
        anchor.current = null;
        handlers.current.onRelease();
      },
    }),
  ).current;

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={index} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                color: c["ink-3"],
                fontFamily: fonts.type,
                fontSize: size.label,
                textTransform: "uppercase",
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/*
        `pointerEvents="none"` on every week row is what makes
        `locationX` trustworthy. A touch is measured from the view that
        *received* it, so while the day cells were targets the reading restarted
        at zero inside every cell and the finger landed on the wrong date — the
        tap that "did nothing" had painted a day somewhere else. With the cells
        out of the way the grid receives every touch itself, and one coordinate
        frame covers the month.
      */}
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        {...responder.panHandlers}
      >
        {weeks.map((week, row) => {
          const looks = week.map((date) => (date ? look(date) : null));
          const joins = weekJoins(looks.map((l) => (l ? markKey(l.mark) : null)));
          return (
            <View key={row} pointerEvents="none" style={{ flexDirection: "row", height: ROW_HEIGHT }}>
              {week.map((date, column) => {
                const l = looks[column];
                if (!date || !l) return <View key={column} style={{ flex: 1 }} />;
                return <DayCell key={column} date={date} look={l} join={joins[column]} />;
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}
