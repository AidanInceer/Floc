"use server";

/**
 * Join-by-link action (ticket 01 step 2, ticket 05). Anyone holding the
 * token can join — no per-invitee tracking, membership just gets created.
 */
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import {
  findTripByInviteToken,
  joinByToken,
  revalidateOverview,
} from "@/server/membership";
import { ensureProfile } from "@/server/profile";

export async function joinTrip(token: string) {
  const redirectTo = `/invite/${token}`;
  const user = await requireUser(redirectTo);

  const found = await findTripByInviteToken(token);
  if (!found) notFound();

  // Reviving a kicked member's soft-deleted row is deliberate — see `joinByToken`.
  await joinByToken(found.id, user.id);

  // Lazily creates a profile for anyone who joined via link before signup
  // fully wired one up (belt-and-braces; signup already calls this too).
  await ensureProfile(user.id);

  revalidateOverview(found.id);
  redirect(`/trip/${found.id}/overview`);
}
