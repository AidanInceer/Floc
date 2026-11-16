/**
 * The phone hero's ticket (ADR-019): the plane crosses the tear, each field
 * fills in turn, then the ticket is stamped and the headline's mark sweeps.
 * `step` counts the beats played so far, as `useScene` gives it.
 */
export const TICKET_FIELDS = ["dates", "going", "route", "each"] as const;

const FLY_MS = 1000;
const FIRST_FIELD_MS = 1500;
const FIELD_GAP_MS = 450;
const STAMP_MS = 3500;

export const TICKET_BEATS = [FLY_MS, ...TICKET_FIELDS.map((_, i) => FIRST_FIELD_MS + i * FIELD_GAP_MS), STAMP_MS] as const;

export const FLOWN = 1;
export const STAMPED = TICKET_BEATS.length;
export const TICKET_SORTED_MS = 4200;

export function fieldFilled(step: number, index: number): boolean {
  return step >= FLOWN + 1 + index;
}
