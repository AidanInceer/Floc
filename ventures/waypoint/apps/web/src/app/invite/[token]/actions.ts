"use server";

/**
 * Join-by-link action (ticket 01 step 2, ticket 05). Anyone holding the
 * token can join — no per-invitee tracking, membership just gets created.
 */
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { requireUser } from "@/server/access";
import { emailConfigured } from "@/server/email";
import {
  findTripByInviteToken,
  joinByToken,
  revalidateInvites,
  revalidateOverview,
  settleInvite,
} from "@/server/membership";
import { ensureProfile } from "@/server/profile";

export async function joinTrip(token: string) {
  const redirectTo = `/invite/${token}`;
  const user = await requireUser(redirectTo);

  const found = await findTripByInviteToken(token);
  if (!found) notFound();

  // #149: joining is the one action gated on a verified inbox. The action is
  // the real enforcement — the page's hidden button can be replayed. Skipped
  // when no mail provider is set, or the link would never arrive (rule 11).
  if (!user.emailVerified && emailConfigured()) {
    redirect(`/invite/${token}?verify=1`);
  }

  // Reviving a kicked member's soft-deleted row is deliberate — see `joinByToken`.
  await joinByToken(found.id, user.id);

  // Lazily creates a profile for anyone who joined via link before signup
  // fully wired one up (belt-and-braces; signup already calls this too).
  await ensureProfile(user.id);

  // Somebody who was also asked by name (ticket 146) has now answered — a
  // pending invite left behind would keep badging the chrome for a trip they
  // are already on. A no-op for everyone else.
  await settleInvite(found.id, user.id, "accepted");

  revalidateInvites();
  revalidateOverview(found.id);
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
