export function justTurnedOn(previous: boolean | undefined, now: boolean): boolean {
  return previous === false && now;
}
