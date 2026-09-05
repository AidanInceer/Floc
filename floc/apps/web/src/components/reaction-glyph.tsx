/**
 * The heart / thumbs-up / thumbs-down glyph set, shared by the two places the
 * group says what it thinks of something: comment reactions in
 * `note-thread.tsx` (ticket 36).
 *
 * One file, because the two controls have to be the same drawing — a board note
 * and its own comment thread sit on screen together, and two hand-drawn hearts
 * a few pixels apart read as two different meanings.
 *
 * No `"use client"`: it renders nothing but paths, so it composes into a client
 * component or a server one.
 */

/** Fixed render order wherever all three appear: heart, thumbs up, thumbs down. */
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
  /** Yours fills in; other people's stay outlined. */
  mine: boolean;
  /** Pixels. The vote chips on a sticky note run a shade larger. */
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
      {/* Thumbs down is thumbs up, turned over. On a `<g>`, not on the `<svg>`
          itself — there the attribute is read as a CSS transform against the
          element box and shunts the glyph out of the row. */}
      <g transform={kind === "down" ? "rotate(180 7 7)" : undefined}>
        {paths.map((d) => (
          <path
            key={d}
            d={d}
            /* The count, not the fill, is what carries the state — colour is
               never the only signal (CLAUDE.md conventions). */
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
