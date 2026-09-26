// A hand-drawn Sicily, not a map: the route's shape is the point.
const COAST =
  "M18 62 C40 50 70 42 96 40 C120 38 140 44 160 46 C190 46 215 40 240 34 L266 26 C262 40 254 56 250 70 C246 84 240 96 238 108 C240 122 248 132 244 146 C238 162 232 176 224 182 C206 172 186 160 164 152 C142 144 122 136 104 126 C84 116 60 106 40 96 C28 88 18 78 18 62 Z";
const PINS = [
  [96, 50],
  [148, 54],
  [240, 72],
  [232, 140],
];

export function SicilySketch() {
  return (
    <svg viewBox="0 0 284 196" aria-hidden className="block w-full">
      <path d={COAST} className="fill-sheet stroke-pastel-blue-edge" strokeWidth={1.2} />
      <path
        d="M96 50 Q122 44 148 54 Q200 50 240 72 Q246 106 232 140"
        fill="none"
        className="stroke-pen"
        strokeWidth={2}
        strokeDasharray="4 5"
        strokeLinecap="round"
      />
      {PINS.map(([x, y], i) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={8} className="fill-pen stroke-sheet" strokeWidth={2} />
          <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-sheet font-mono text-[9px] font-semibold">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
