import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userTravelStyle } from "@/db/schema";

export type TravelStyle = Pick<
  typeof userTravelStyle.$inferSelect,
  "homeAirport" | "travelCabin" | "travelStay" | "travelPace" | "styleInGroupIdeas"
>;

const DEFAULT_TRAVEL_STYLE: TravelStyle = {
  homeAirport: null,
  travelCabin: null,
  travelStay: null,
  travelPace: null,
  styleInGroupIdeas: true,
};

export async function readTravelStyle(userId: string): Promise<TravelStyle> {
  const row = await db
    .select({
      homeAirport: userTravelStyle.homeAirport,
      travelCabin: userTravelStyle.travelCabin,
      travelStay: userTravelStyle.travelStay,
      travelPace: userTravelStyle.travelPace,
      styleInGroupIdeas: userTravelStyle.styleInGroupIdeas,
    })
    .from(userTravelStyle)
    .where(eq(userTravelStyle.userId, userId))
    .get();
  return row ?? DEFAULT_TRAVEL_STYLE;
}

export async function saveTravelStyle(userId: string, patch: Partial<TravelStyle>, on: Pick<typeof db, "insert"> = db): Promise<void> {
  await on
    .insert(userTravelStyle)
    .values({ userId, ...patch })
    .onConflictDoUpdate({ target: userTravelStyle.userId, set: { ...patch, lastModifiedAt: new Date() } });
}
