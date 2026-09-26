/**
 * The one door every trip-scoped port method goes through (ticket 287; split
 * out of `api-port.ts` when the port grew a second and third file).
 *
 * `findTripAccess` is `requireTripAccess` without the redirect: a trip that
 * does not exist and one the viewer is not in answer identically (rule 5). It
 * lives on its own so the files and social halves resolve access the same way
 * the trip half does, rather than each growing a copy that can drift.
 */
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { findTripAccess, type TripAccess } from "@/server/access";

/** Refusing is a thrown error, not a redirect — a route handler cannot catch `notFound()`. */
export async function scoped(
  viewerId: string,
  tripId: number,
): Promise<TripAccess> {
  const access = await findTripAccess(tripId, viewerId);
  // The router already resolved the trip through `loadTrip`; the request memo
  // makes this repeat free, so it only refuses on a race.
  if (!access) throw new Refusal("No such trip.", "missing");
  return access;
}
