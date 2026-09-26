// The web trip tabs' own marks (`nav-glyphs.tsx`), so a section looks the same on both.
import Svg, { Circle, Path } from "react-native-svg";

type Drawing = { paths: string[]; circles?: [number, number, number][] };

const DRAWINGS: Record<string, Drawing> = {
  "": { paths: ["M2 3h10v8H2zM2 9l3-2.6 2.4 2 2-1.5L12 9.4"] },
  dates: { paths: ["M2.2 3.4h9.6v8.4H2.2zM2.2 6h9.6M4.8 2v2.4M9.2 2v2.4"] },
  days: {
    paths: ["M4.6 3.6h4.6a1.7 1.7 0 0 1 0 3.4H4.8a1.7 1.7 0 0 0 0 3.4h4.6"],
    circles: [
      [3.4, 3.6, 1.2],
      [10.6, 10.4, 1.2],
    ],
  },
  money: { paths: ["M8.6 4.6a1.8 1.8 0 0 0-3.1 1.2v3.6H4.6M4.6 7.4h3M5.5 9.4h4"], circles: [[7, 7, 5]] },
  packing: { paths: ["M3.2 4.6h7.6l-.6 7.4H3.8zM5.2 4.6V3.4a1.8 1.8 0 0 1 3.6 0v1.2"] },
  notes: { paths: ["M3 1.8h5.4L11 4.4v7.8H3zM8.2 1.8v2.8H11M5 7h4M5 9.4h3"] },
  files: { paths: ["M1.8 3.2h3.6l1.2 1.4h5.6v7H1.8z"] },
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
