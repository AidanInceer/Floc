import "server-only";

import { cache } from "react";

import { getInviteGuest, getSession } from "@/server/access";
import { findTripByShareLink } from "@/server/trips/invites";
import { isLiveMember } from "@/server/trips/live-member";

export const inviteTrip = cache(async (token: string) => {
  return findTripByShareLink(token);
});

export function inviteAuthHrefs(token: string) {
  const back = `/invite/${token}/join`;
  return {
    signUpHref: `/signup?redirect=${encodeURIComponent(back)}`,
    signInHref: `/login?redirect=${encodeURIComponent(back)}`,
  };
}

export function inviteTokenIn(redirect: string | undefined): string | null {
  return /^\/invite\/([^/?#]+)(?:\/join)?$/.exec(redirect ?? "")?.[1] ?? null;
}

export type InviteViewer =
  | { kind: "stranger" }
  | { kind: "guest"; id: string; name: string }
  | { kind: "canJoin" }
  | { kind: "member"; tripId: number };

export async function inviteViewer(tripId: number): Promise<InviteViewer> {
  const session = await getSession();
  if (!session?.user) {
    const guest = await getInviteGuest();
    return guest ? { kind: "guest", ...guest } : { kind: "stranger" };
  }

  if (await isLiveMember(tripId, session.user.id)) {
    return { kind: "member", tripId };
  }

  return { kind: "canJoin" };
}
