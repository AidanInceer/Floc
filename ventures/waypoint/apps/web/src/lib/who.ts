/**
 * Which pastel wash a person's avatar gets (ticket 11). Tokens (`--who-1`…
 * `--who-8`) live in globals.css. Lives in `lib/`, not next to `Avatar`,
 * because `lib/access.ts` stamps every `TripMember` with its tone while
 * loading the roster.
 */

const WHO_TONES = 8;

/** Colour by roster position — preferred form, no clashes within one trip. Wraps past eight members. */
export function seatTone(seat: number): string {
  return `who-${(seat % WHO_TONES) + 1}`;
}

/**
 * Colour by hashed name — fallback for an avatar with no roster behind it
 * (header, a friend, a former member). No coordination needed; occasional
 * clashes are fine since colour is never the only way to tell people apart.
 */
export function whoTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    // djb2-ish, kept in 32-bit range.
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return `who-${(Math.abs(hash) % WHO_TONES) + 1}`;
}
