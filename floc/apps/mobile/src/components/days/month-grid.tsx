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
const RING = 1.5;

type Join = { left: boolean; right: boolean };

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

function Disc({ onTrip, own }: { onTrip: boolean; own: "free" | "prefer" }) {
  const { c } = useTheme();
  const base = { position: "absolute", width: DISC, height: DISC, borderRadius: radius.pill } as const;
  if (own === "prefer") return <View style={{ ...base, backgroundColor: c.sheet, borderWidth: onTrip ? 0 : RING, borderColor: c.ink }} />;
  return <View style={{ ...base, borderWidth: 1, borderColor: onTrip ? c.sheet : c["ink-3"] }} />;
}


function decoration(look: DayLook): "line-through" | "underline" | "none" {
  if (look.cut) return "line-through";
  return look.today ? "underline" : "none";
}

function DayCell({ date, look, join }: { date: string; look: DayLook; join: Join }) {
  const { c } = useTheme();
  const key = markKey(look.mark);
  const fill = FILL[key];
  const onTrip = key === "trip";
  const own = look.own ?? (look.mine ? "free" : "off");
  const liked = own === "prefer";
  const base = fill ? c[fill.ink] : c.ink;
  const ink = liked ? (onTrip ? c.green : c.ink) : base;
  return (
    <View accessibilityLabel={look.label} style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: look.past ? 0.7 : 1 }}>
      {fill ? <Shape fill={fill} join={join} /> : null}
      {own === "off" ? null : <Disc onTrip={onTrip} own={own} />}
      <Text
        style={{
          color: ink,
          fontFamily: onTrip || liked ? fonts.typeBold : fonts.type,
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
  onPaint: (anchor: string, target: string) => void;
  onRelease: () => void;
}) {
  const { c } = useTheme();
  const weeks = monthGrid(month);
  const [width, setWidth] = useState(0);

  const anchor = useRef<string | null>(null);
  const geometry = useRef({ width: 0, weeks });
  geometry.current = { width, weeks };

  const handlers = useRef({ onPaint, onRelease });
  handlers.current = { onPaint, onRelease };

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
