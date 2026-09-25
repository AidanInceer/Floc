/**
 * The editor's own line icons (#408): 14x14, no fill, drawn in the current
 * colour. Page and trip-link icons come from `@floc/core`, so a chip and the
 * phone draw the same hand.
 */
import { PAGE_ICON_ART, type PageIcon } from "@floc/core/notes/pages/page-icons";

const PATHS = {
  plus: ["M7 2.5v9M2.5 7h9"],
  dots: ["M3 7h.01M7 7h.01M11 7h.01"],
  grip: ["M5.2 3.2h.01M8.8 3.2h.01M5.2 7h.01M8.8 7h.01M5.2 10.8h.01M8.8 10.8h.01"],
  gripH: ["M3.2 5.2h.01M7 5.2h.01M10.8 5.2h.01M3.2 8.8h.01M7 8.8h.01M10.8 8.8h.01"],
  open: ["M3.5 5.5 7 9l3.5-3.5"],
  shut: ["M5.5 3.5 9 7l-3.5 3.5"],
  bold: ["M4 2.5h3.6a2.2 2.2 0 0 1 0 4.4H4zm0 4.4h4.2a2.3 2.3 0 0 1 0 4.6H4zV2.5"],
  italic: ["M8.5 2.5 5.5 11.5M6 2.5h5M3 11.5h5"],
  underline: ["M4 2v4.6a3 3 0 0 0 6 0V2M3 12.2h8"],
  strike: ["M2.5 7h9M9.8 4.2C9.4 3 8.3 2.4 7 2.4c-1.6 0-2.8.9-2.8 2.1M4.3 9.6c.4 1.2 1.5 2 2.9 2 1.7 0 2.9-.9 2.9-2.2"],
  link: ["M6 8a2.5 2.5 0 0 0 3.6 0l2-2A2.5 2.5 0 0 0 8 2.4l-.8.8M8 6a2.5 2.5 0 0 0-3.6 0l-2 2A2.5 2.5 0 0 0 6 11.6l.8-.8"],
  comment: ["M3 2.2h8a1.2 1.2 0 0 1 1.2 1.2v5.2A1.2 1.2 0 0 1 11 9.8H6.4L3.6 12V9.8H3a1.2 1.2 0 0 1-1.2-1.2V3.4A1.2 1.2 0 0 1 3 2.2Z", "M4.6 4.9h4.8M4.6 7.1h3"],
  bubble: ["M3 2.2h8a1.2 1.2 0 0 1 1.2 1.2v5.2A1.2 1.2 0 0 1 11 9.8H6.4L3.6 12V9.8H3a1.2 1.2 0 0 1-1.2-1.2V3.4A1.2 1.2 0 0 1 3 2.2Z"],
  clear: ["M2.5 2.8h7M6 2.8v8.4", "m8.6 8.6 3 3M11.6 8.6l-3 3"],
  trash: ["M2.5 3.8h9M5.5 3.8V2.5h3v1.3M3.7 3.8l.6 8h5.4l.6-8"],
  check: ["m3 7.2 2.6 2.6L11 4.4"],
  close: ["m3.5 3.5 7 7M10.5 3.5l-7 7"],
  send: ["M2.5 7h8.5M7.5 3.5 11 7l-3.5 3.5"],
  table: ["M3 2.5h8a1.2 1.2 0 0 1 1.2 1.2v6.6a1.2 1.2 0 0 1-1.2 1.2H3a1.2 1.2 0 0 1-1.2-1.2V3.7A1.2 1.2 0 0 1 3 2.5Z", "M1.8 5.5h10.4M1.8 8.5h10.4M5.5 5.5v6M8.8 5.5v6"],
  smile: ["M5 8.4c.5.7 1.2 1 2 1s1.5-.3 2-1M5.3 5.7h.01M8.7 5.7h.01", "M12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z"],
  indent: ["M2.5 3h9M6 7h5.5M2.5 11h9M2.5 5.5 4.5 7l-2 1.5"],
  outdent: ["M2.5 3h9M6 7h5.5M2.5 11h9M4.5 5.5 2.5 7l2 1.5"],
  rail: ["M3.4 2.3h7.2a1.6 1.6 0 0 1 1.6 1.6v6.2a1.6 1.6 0 0 1-1.6 1.6H3.4a1.6 1.6 0 0 1-1.6-1.6V3.9a1.6 1.6 0 0 1 1.6-1.6Z", "M5.2 2.3v9.4"],
  keyboard: ["M2.5 3.5h9a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z", "M4 6h.01M6 6h.01M8 6h.01M10 6h.01M4.5 8.5h5"],
} as const;

export type IconName = keyof typeof PATHS;

const HEAVY: readonly IconName[] = ["dots", "grip", "gripH"];

export function Icon({ name, size = 13 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={HEAVY.includes(name) ? 1.9 : 1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** A page icon or a trip-link kind, from the shared art. Drawn thinner when large, as the other big marks are. */
export function Glyph({ name, size = 13 }: { name: PageIcon; size?: number }) {
  const art = PAGE_ICON_ART[name];
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={size > 16 ? 0.75 : 1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {art.paths.map((d) => <path key={d} d={d} />)}
      {art.circles.map((c) => <circle key={`${c.cx}-${c.cy}`} cx={c.cx} cy={c.cy} r={c.r} />)}
    </svg>
  );
}

/** The same art as a string, for a chip drawn outside React. */
export function glyphMarkup(name: PageIcon, size = 12): string {
  const art = PAGE_ICON_ART[name];
  const shapes = [...art.paths.map((d) => `<path d="${d}"/>`), ...art.circles.map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/>`)].join("");
  return `<svg viewBox="0 0 14 14" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes}</svg>`;
}
