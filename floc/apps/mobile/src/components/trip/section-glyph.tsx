// The web trip tabs' own marks (`nav-glyphs.tsx`), so a section looks the same on both.
import Svg, { Circle, Path } from "react-native-svg";

type Drawing = { paths: string[]; circles?: [number, number, number][] };

const DRAWINGS: Record<string, Drawing> = {
  "": {
    paths: [
      "M3.6 2h6.8A1.6 1.6 0 0 1 12 3.6v6.8a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 10.4V3.6A1.6 1.6 0 0 1 3.6 2ZM7 2v10M7 7h5",
    ],
  },
  dates: {
    paths: [
      "M3.4 3h7.2A1.4 1.4 0 0 1 12 4.4v6.4a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 10.8V4.4A1.4 1.4 0 0 1 3.4 3ZM4.8 1.8v2.4M9.2 1.8v2.4M2 6h10",
    ],
  },
  days: {
    paths: ["M6 3.6h6M6 7h6M6 10.4h4"],
    circles: [
      [2.8, 3.6, 0.9],
      [2.8, 7, 0.9],
      [2.8, 10.4, 0.9],
    ],
  },
  money: { paths: ["M3 1.8h8v10.4l-1.3-.9-1.4.9-1.3-.9-1.3.9-1.4-.9-1.3.9ZM5 4.6h4M5 6.6h4"] },
  packing: {
    paths: [
      "M3.8 4.4h6.4a1.4 1.4 0 0 1 1.4 1.4V10a1.4 1.4 0 0 1-1.4 1.4H3.8A1.4 1.4 0 0 1 2.4 10V5.8a1.4 1.4 0 0 1 1.4-1.4ZM5.2 4.4V3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.4M5 4.4v7M9 4.4v7",
    ],
  },
  notes: { paths: ["M3 2h5.6L11 4.4V12H3ZM5 7h4M5 9.4h4"] },
  files: {
    paths: [
      "M1.8 4v7a1 1 0 0 0 1 1h8.4a1 1 0 0 0 1-1V5.6a1 1 0 0 0-1-1H6.6L5.4 3H2.8a1 1 0 0 0-1 1ZM1.8 6.6h10.4",
    ],
  },
};

export function SectionGlyph({ route, color }: { route: string; color: string }) {
  const drawing = DRAWINGS[route];
  if (!drawing) return null;
  const line = { stroke: color, strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <Svg width={15} height={15} viewBox="0 0 14 14" fill="none">
      {drawing.circles?.map(([cx, cy, r]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} {...line} />)}
      {drawing.paths.map((d) => (
        <Path key={d} d={d} {...line} />
      ))}
    </Svg>
  );
}
