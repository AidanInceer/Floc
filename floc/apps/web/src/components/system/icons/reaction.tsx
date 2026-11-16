export type GlyphKind = "heart" | "up" | "down";

const HEART =
  "M7 12.1C3.3 9.4 1.5 7.5 1.5 5.4A3.2 3.2 0 0 1 7 3.5a3.2 3.2 0 0 1 5.5 1.9c0 2.1-1.8 4-5.5 6.7Z";
const THUMB = [
  "M4.3 6.1 6.9 1.5a1.35 1.35 0 0 1 2 1.25V5.5h2.9a1.2 1.2 0 0 1 1.16 1.53l-1.1 3.85A1.5 1.5 0 0 1 10.4 12H4.3Z",
  "M1.3 6.1h2.4V12H1.3Z",
];

export function ReactionGlyph({
  kind,
  mine,
  size = 13,
}: {
  kind: GlyphKind;
  mine: boolean;
  size?: number;
}) {
  const paths = kind === "heart" ? [HEART] : THUMB;
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="shrink-0"
      style={{ width: size, height: size }}
    >
      <g transform={kind === "down" ? "rotate(180 7 7)" : undefined}>
        {paths.map((d) => (
          <path
            key={d}
            d={d}
            fill={mine ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={mine ? 0 : 1.25}
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}
