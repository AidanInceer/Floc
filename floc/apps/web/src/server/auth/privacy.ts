import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userPrivacy } from "@/db/schema";
import { refresh } from "@/server/freshness";

export type Privacy = Pick<
  typeof userPrivacy.$inferSelect,
  "isPrivate" | "visibilityVibeTags" | "visibilityTravelMap" | "visibilityFriends" | "visibilitySaved" | "pastTripsShow"
>;

const DEFAULT_PRIVACY: Privacy = {
  isPrivate: false,
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "trip_members",
  visibilityFriends: "friends",
  visibilitySaved: "private",
  pastTripsShow: "all",
};

const privacyColumns = {
  isPrivate: userPrivacy.isPrivate,
  visibilityVibeTags: userPrivacy.visibilityVibeTags,
  visibilityTravelMap: userPrivacy.visibilityTravelMap,
  visibilityFriends: userPrivacy.visibilityFriends,
  visibilitySaved: userPrivacy.visibilitySaved,
  pastTripsShow: userPrivacy.pastTripsShow,
};

export async function readPrivacy(userId: string): Promise<Privacy> {
  const row = await db.select(privacyColumns).from(userPrivacy).where(eq(userPrivacy.userId, userId)).get();
  return row ?? DEFAULT_PRIVACY;
}

export async function savePrivacy(userId: string, patch: Partial<Privacy>, on: Pick<typeof db, "insert"> = db): Promise<void> {
  await on
    .insert(userPrivacy)
    .values({ userId, ...patch })
    .onConflictDoUpdate({ target: userPrivacy.userId, set: { ...patch, lastModifiedAt: new Date() } });
  refresh({ kind: "profile" });
}
