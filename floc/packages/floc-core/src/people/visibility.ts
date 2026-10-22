/**
 * Who sees one part of a profile. The rings nest — travelled with includes
 * friends — so settings draw a ring as two ticks, and a tick on the wider
 * column brings the narrower one with it.
 */
export type Visibility = "private" | "friends" | "trip_members";

export type RingColumn = "friends" | "trip_members";

export function ringTicks(ring: Visibility): Record<RingColumn, boolean> {
  return { friends: ring !== "private", trip_members: ring === "trip_members" };
}

export function tickRing(ring: Visibility, column: RingColumn, on: boolean): Visibility {
  if (column === "trip_members") {
    if (on) return "trip_members";
    return ring === "trip_members" ? "friends" : ring;
  }
  if (!on) return "private";
  return ring === "private" ? "friends" : ring;
}
