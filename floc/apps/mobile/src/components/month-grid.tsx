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
 * Cells are drawn but never *only* drawn: a day carries its number, and a
 * shaded day carries the count of who is free (#204).
 */
import { WEEKDAY_LABELS, monthGrid, type IsoMonth } from "@floc/core/availability";
import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** How a single cell should read. The screen decides; this only draws. */
export type CellLook = {
  /** Filled ground, or none. A token name, never a hex. */
  ground: string | null;
  /** Ink for the day number, when the ground needs a different one. */
  ink: string | null;
  /** A number under the day — how many people are free. Null draws nothing. */
  count: number | null;
  /** A ring, for the trip window's own days. */
  ringed: boolean;
};

/** One day. Drawn only — the gesture belongs to the grid, for the reason above. */
function DayCell({ date, cell }: { date: string; cell: CellLook }) {
  const { c } = useTheme();
  const ink = cell.ink ? c[cell.ink] : c.ink;
  return (
    <View
      accessibilityLabel={cell.count === null ? date : `${date}, ${cell.count} free`}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        margin: 2,
        borderRadius: radius.sm,
        backgroundColor: cell.ground ? c[cell.ground] : "transparent",
        borderWidth: cell.ringed ? 1.5 : StyleSheet.hairlineWidth,
        borderColor: cell.ringed ? c.pen : "transparent",
      }}
    >
      <Text
        style={{
          color: ink,
          fontFamily: fonts.type,
          fontSize: size.body,
          fontVariant: ["tabular-nums"],
        }}
      >
        {Number(date.slice(8))}
      </Text>
      {cell.count !== null ? (
        <Text
          style={{
            color: cell.ink ? c[cell.ink] : c["ink-2"],
            fontFamily: fonts.type,
            fontSize: size.label,
            marginTop: space.xs / 2,
          }}
        >
          {cell.count}
        </Text>
      ) : null}
    </View>
  );
}

const ROW_HEIGHT = 52;

export function MonthGrid({
  month,
  look,
  onPaint,
  onRelease,
}: {
  month: IsoMonth;
  look: (date: string) => CellLook;
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
        {weeks.map((week, row) => (
          <View
            key={row}
            pointerEvents="none"
            style={{ flexDirection: "row", height: ROW_HEIGHT }}
          >
            {week.map((date, column) => {
              if (!date) return <View key={column} style={{ flex: 1 }} />;
              return <DayCell key={column} date={date} cell={look(date)} />;
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
