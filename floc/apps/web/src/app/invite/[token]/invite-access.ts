/**
 * Resolving a share token, once, for every page under `/invite/[token]` (#330).
 *
 * Its own module rather than a layout export: a Next layout cannot hand a
 * resolved value to the page beneath it, so both call this instead. `cache()`
 * keys on the token, so the several calls per navigation are one query.
 *
 * There is no `requireX` here on purpose. Somebody arriving on a share link has
 * nothing to prove and nowhere to be redirected — the page draws the dead-link
 * answer itself, the same answer for a token that was withdrawn and one that
 * never existed.
 */
import "server-only";

import { cache } from "react";

import { getSession } from "@/server/access";
import { findTripByInviteToken } from "@/server/trips/invites";
import { isLiveMember } from "@/server/trips/roster";

export const inviteTrip = cache(async (token: string) => {
  return findTripByInviteToken(token);
});

/** Where somebody on this link goes to stop being a guest. `via=link` marks a sign-up that arrived this way. */
export function inviteAuthHrefs(token: string) {
  const back = `/invite/${token}`;
  return {
    signUpHref: `/signup?redirect=${encodeURIComponent(back)}&via=link`,
    signInHref: `/login?redirect=${encodeURIComponent(back)}`,
  };
}

export type InviteViewer =
  | { kind: "stranger" }
  | { kind: "canJoin" }
  | { kind: "member"; tripId: number };

/** Why: not `cache()`d, unlike `inviteTrip` above — the answer depends on the session, which is not an argument. */
export async function inviteViewer(tripId: number): Promise<InviteViewer> {
  const session = await getSession();
  if (!session?.user) return { kind: "stranger" };

  if (await isLiveMember(tripId, session.user.id)) {
    return { kind: "member", tripId };
  }

  return { kind: "canJoin" };
}
