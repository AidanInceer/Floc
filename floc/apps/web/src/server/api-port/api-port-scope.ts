import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { findTripAccess, type TripAccess } from "@/server/access";

export async function scoped(
  viewerId: string,
  tripId: number,
): Promise<TripAccess> {
  const access = await findTripAccess(tripId, viewerId);
  if (!access) throw new Refusal("No such trip.", "missing");
  return access;
}
