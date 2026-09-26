/**
 * Which pastel wash a person's avatar gets (ticket 11). Tokens (`--who-1`…
 * `--who-8`) live in globals.css. Lives in `lib/`, not next to `Avatar`,
 * because `server/access.ts` stamps every `TripMember` with its tone while
 * loading the roster.
 *
 * Colour by hashed name, everywhere — a person is the same colour on every
 * trip and in the account header. The earlier seat-position scheme gave no
 * within-trip clashes but made the same person a different colour per context;
 * consistency won (colour is never the only way people are told apart, so the
 * rare clash is acceptable).
 */

const WHO_TONES = 8;

export type WhoTone = `who-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export function whoTone(name: string): WhoTone {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    // djb2-ish, kept in 32-bit range.
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return `who-${(Math.abs(hash) % WHO_TONES) + 1}` as WhoTone;
}
