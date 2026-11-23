import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { groupFits, groupIdeas, withoutSpend, type GroupIdea } from "@floc/core/trip/explore/fit/group-fit";
import { groupIdeasListName } from "@floc/core/trip/explore/fit/group-words";
import { listingFits, type Fits } from "@floc/core/trip/explore/fit/listing-fit";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { readVibeTags } from "@floc/core/trip/vibe-tags";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { user, userProfile, userTravelStyle } from "@/db/schema";
import { homeCurrenciesFor } from "@/server/auth/profile";
import { loadPastTravel } from "@/server/explore/travel-read";
import { listingRates } from "@/server/money/viewer-currency";
import { createWishList } from "@/server/wish-lists/wish-list-writes";
import { wishListFor } from "@/server/wish-lists/wish-lists";

import { listGroupsFor } from "./groups";

export type GroupIdeas = { name: string; people: number; withStyle: number; you: boolean; ideas: GroupIdea[] };
export type SentIdea = { presetId: string; itemId: number; votes: number; voted: boolean };
export type SentGroupIdeas = { listId: number; items: SentIdea[] };

const ORDER = PRESET_TRIPS.map((trip) => trip.id);

async function stylesOf(userIds: string[]) {
  const rows = await db
    .select({
      userId: user.id,
      vibeTags: userProfile.vibeTags,
      stay: userTravelStyle.travelStay,
      pace: userTravelStyle.travelPace,
      shared: userTravelStyle.styleInGroupIdeas,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .leftJoin(userTravelStyle, eq(userTravelStyle.userId, user.id))
    .where(inArray(user.id, userIds))
    .limit(userIds.length)
    .all();
  return new Map(rows.map((row) => [row.userId, row]));
}

async function found(ownerId: string, groupId: number) {
  const group = (await listGroupsFor(ownerId)).find((g) => g.id === groupId);
  if (!group) return null;
  const memberIds = group.members.map((member) => member.id);
  const styles = await stylesOf([ownerId, ...memberIds]);
  const asked = [ownerId, ...memberIds.filter((id) => styles.get(id)?.shared !== false)];
  const [currencies, pasts] = await Promise.all([homeCurrenciesFor([ownerId]), Promise.all(asked.map(loadPastTravel))]);
  const rates = await listingRates(currencies.get(ownerId) ?? "GBP");

  const fits = new Map<string, Fits>();
  asked.forEach((id, place) => {
    const style = styles.get(id);
    const profile = { vibes: readVibeTags(style?.vibeTags), stay: style?.stay ?? null, pace: style?.pace ?? null, ...pasts[place] };
    const figures = listingFits(withoutSpend(profile), PRESET_TRIPS, rates);
    if (figures) fits.set(id, figures);
  });

  return {
    group,
    memberIds,
    ideas: {
      name: group.name,
      people: memberIds.length,
      withStyle: memberIds.filter((id) => fits.has(id)).length,
      you: fits.has(ownerId),
      ideas: groupIdeas(groupFits([...fits.values()]), ORDER),
    } satisfies GroupIdeas,
  };
}

export async function groupIdeasFor(ownerId: string, groupId: number): Promise<GroupIdeas | null> {
  return (await found(ownerId, groupId))?.ideas ?? null;
}

export async function sendGroupIdeas(ownerId: string, groupId: number): Promise<SentGroupIdeas> {
  const all = await found(ownerId, groupId);
  if (!all) throw new Refusal("That group is gone.", "missing");
  if (all.ideas.ideas.length === 0) throw new Refusal("There are no trip ideas to send yet.", "invalid");
  const listId = await createWishList(ownerId, {
    name: groupIdeasListName(all.group.name),
    inviteIds: all.memberIds,
    items: all.ideas.ideas.map((idea) => ({ kind: "explore", presetId: idea.presetId })),
  });
  const list = await wishListFor(ownerId, listId);
  const items = (list?.items ?? []).flatMap((item) =>
    item.presetId ? [{ presetId: item.presetId, itemId: item.id, votes: item.votes, voted: item.voted }] : [],
  );
  return { listId, items };
}
