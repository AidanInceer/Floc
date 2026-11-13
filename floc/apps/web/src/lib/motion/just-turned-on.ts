/**
 * True only on the change from off to on, so a mark plays its motion for the
 * press that made it (ADR-053) and never for what was already on at page load.
 */
export function justTurnedOn(previous: boolean | undefined, now: boolean): boolean {
  return previous === false && now;
}
