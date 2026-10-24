"use server";

/**
 * Join-by-link action (ticket 01 step 2, ticket 05). Anyone holding the
 * token can join — no per-invitee tracking, membership just gets created.
 */
import { notFound, redirect } from "next/navigation";

import { isIsoDate } from "@floc/core/dates/dates";
import { Refusal, isRefusal } from "@floc/core/errors/refusal";
import { guestName } from "@floc/core/people/guests";

import { getInviteGuest, getSession, requireUser } from "@/server/access";
import { refresh } from "@/server/freshness";
import { assertGuestRoom } from "@/server/guests/guests";
import { startGuest } from "@/server/guests/guest-start";
import { findIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import { setAvailability } from "@/server/itinerary/availability";
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

async function tripFor(token: string) {
  const found = await findTripByInviteToken(token);
  if (!found) notFound();
  if (await getSession()) redirect(`/trip/${found.id}/overview`);
  return found;
}

const asForm = async (work: () => Promise<void>): Promise<{ error?: string }> => {
  try {
    await work();
    return {};
  } catch (error) {
    if (isRefusal(error)) return { error: error.message };
    throw error;
  }
};

/** The name comes before any answer (#442, ADR-029); a returning guest keeps the one they gave. */
export async function guestStart(token: string, name: unknown): Promise<{ error?: string }> {
  return asForm(async () => {
    const found = await tripFor(token);
    if (await getInviteGuest()) return;
    const given = guestName(name);
    if (!given) throw new Refusal("Give your name first.");
    await assertGuestRoom(found.id, null);
    await startGuest(given);
    refresh({ kind: "invitePage", token });
  });
}

/** A guest's answers: their own, on the trip the link names, under the trip's guest cap. */
async function asGuest(token: string, write: (tripId: number, guestId: string) => Promise<void>) {
  return asForm(async () => {
    const found = await tripFor(token);
    const guest = await getInviteGuest();
    if (!guest) throw new Refusal("Give your name first.");
    await assertGuestRoom(found.id, guest.id);
    await write(found.id, guest.id);
    refresh({ kind: "tripDates", tripId: found.id }, { kind: "tripOverview", tripId: found.id }, { kind: "invitePage", token });
  });
}

export async function guestVoteIdea(token: string, ideaId: number): Promise<{ error?: string }> {
  return asGuest(token, async (tripId, guestId) => {
    const target = await findIdea(tripId, Number(ideaId));
    if (!target) notFound();
    await toggleIdeaVote(target.id, guestId);
  });
}

export async function guestSaveDates(token: string, add: string[], remove: string[]): Promise<{ error?: string }> {
  if (![...add, ...remove].every(isIsoDate)) return { error: "That is not a date." };
  return asGuest(token, async (tripId, guestId) => {
    await setAvailability(tripId, guestId, add, true);
    await setAvailability(tripId, guestId, remove, false);
  });
}
