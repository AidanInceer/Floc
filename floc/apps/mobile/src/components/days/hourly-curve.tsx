/**
 * One day's hours as a temperature line over rain bars — the web's
 * `HourlyChart`, same geometry, so the shape of a day reads the same on both.
 */
import type { WeatherCondition } from "@floc/core/itinerary/weather";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export type HourlyPoint = { hour: string; condition: WeatherCondition; temp: number; pop: number };

const W = 700;
const H = 132;
const PAD = 26;
const TOP = 34;
const BASE = 96;
const RAIN_Y = H - 18;

function Key({ word, ground, bar }: { word: string; ground: string; bar: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <View
        style={{
          width: bar ? 12 : 16,
          height: bar ? 10 : 2,
          borderRadius: bar ? 2 : radius.pill,
          backgroundColor: ground,
          opacity: bar ? 0.4 : 1,
        }}
      />
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.label }}>{word}</Text>
    </View>
  );
}

export function HourlyCurve({ points }: { points: HourlyPoint[] }) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  if (points.length < 2) return null;

  const temps = points.map((p) => p.temp);
  const lo = Math.min(...temps);
  const span = Math.max(Math.max(...temps) - lo, 1);
  const x = (i: number) => PAD + i * ((W - PAD * 2) / (points.length - 1));
  const y = (t: number) => TOP + (1 - (t - lo) / span) * (BASE - TOP);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.temp).toFixed(1)}`).join(" ");

  return (
    <View style={{ gap: space.xs }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
          <Line x1={PAD} y1={RAIN_Y} x2={W - PAD} y2={RAIN_Y} stroke={c.rule} strokeWidth={StyleSheet.hairlineWidth * 2} />
          {points.map((p, i) =>
            p.pop > 0 ? (
              <Rect
                key={`r-${p.hour}`}
                x={x(i) - 13}
                y={RAIN_Y - (3 + (p.pop / 100) * 15)}
                width={26}
                height={3 + (p.pop / 100) * 15}
                rx={1.5}
                fill={c.pen}
                opacity={0.4}
              />
            ) : null,
          )}
          <Path d={line} fill="none" stroke={c.pen} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle key={`p-${p.hour}`} cx={x(i)} cy={y(p.temp)} r={5} fill={c["sheet-2"]} stroke={c.pen} strokeWidth={2.4} />
          ))}
          {points.map((p, i) => (
            <SvgText key={`t-${p.hour}`} x={x(i)} y={y(p.temp) - 12} textAnchor="middle" fill={c.ink} fontSize={20}>
              {`${p.temp}°`}
            </SvgText>
          ))}
          {points.map((p, i) => (
            <SvgText key={`h-${p.hour}`} x={x(i)} y={H - 2} textAnchor="middle" fill={c["ink-3"]} fontSize={18}>
              {p.hour}
            </SvgText>
          ))}
        </Svg>
      ) : null}
      <View style={{ flexDirection: "row", gap: space.md }}>
        <Key word="Temperature" ground={c.pen} bar={false} />
        <Key word="Chance of rain" ground={c.pen} bar />
      </View>
    </View>
  );
}
