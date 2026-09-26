"use server";

/**
 * Join-by-link action (ticket 01 step 2, ticket 05). Anyone holding the
 * token can join — no per-invitee tracking, membership just gets created.
 */
import { notFound, redirect } from "next/navigation";

import { isRefusal } from "@floc/core/errors/refusal";

import { requireUser } from "@/server/access";
import { findTripByInviteToken, joinWithLink } from "@/server/trips/invites";

export async function joinTrip(token: string) {
  const user = await requireUser(`/invite/${token}`);

  const found = await findTripByInviteToken(token);
  if (!found) notFound();

  try {
    await joinWithLink(found.id, user.id);
  } catch (error) {
    if (isRefusal(error)) redirect(`/invite/${token}?full=1`);
    throw error;
  }

  redirect(`/trip/${found.id}/overview`);
}
