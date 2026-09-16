"use server";

/**
 * Join-by-link action (ticket 01 step 2, ticket 05). Anyone holding the
 * token can join — no per-invitee tracking, membership just gets created.
 */
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/server/auth/auth";
import { requireUser } from "@/server/access";
import { emailConfigured } from "@/server/auth/email";
import { findTripByInviteToken, joinWithLink } from "@/server/trips/invites";
import { isLiveMember } from "@/server/trips/roster";

export async function joinTrip(token: string) {
  const redirectTo = `/invite/${token}`;
  const user = await requireUser(redirectTo);

  const found = await findTripByInviteToken(token);
  if (!found) notFound();

  if (await isLiveMember(found.id, user.id)) redirect(`/trip/${found.id}/overview`);

  // #149: joining is the one action gated on a verified inbox. The action is
  // the real enforcement — the page's hidden button can be replayed. Skipped
  // when no mail provider is set, or the link would never arrive (rule 11).
  if (!user.emailVerified && emailConfigured()) {
    redirect(`/invite/${token}?verify=1`);
  }

  // Joining means more than a membership row — reviving a kicked member's row,
  // a lazy profile, and answering any invite they also hold by name. `joinWithLink`
  // owns that sequence for both doors.
  await joinWithLink(found.id, user.id);

  redirect(`/trip/${found.id}/overview`);
}

/**
 * Resend the verification mail for the signed-in user (ticket 149). Used by
 * the invite page's verify notice. No-ops silently if there's no session or
 * the address is already verified — nothing here reveals which.
 */
export async function resendVerification(token: string) {
  const user = await requireUser(`/invite/${token}`);
  if (!user.emailVerified) {
    await auth.api.sendVerificationEmail({
      headers: await headers(),
      body: { email: user.email, callbackURL: `/invite/${token}` },
    });
  }
  redirect(`/invite/${token}?verify=sent`);
}
