import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { wishListItem, wishListItemVote } from "@/db/schema";
import { touch } from "@/server/audit";

import { seatOn } from "./wish-lists";

const GONE = "That wish list is gone.";
const NO_ITEM = "That is no longer on the list.";

export async function toggleWishVote(userId: string, listId: number, itemId: number): Promise<void> {
  await db.transaction(async (tx) => {
    if ((await seatOn(userId, listId, tx)) !== "accepted") throw new Refusal(GONE, "missing");
    const item = await tx
      .select({ id: wishListItem.id })
      .from(wishListItem)
      .where(and(eq(wishListItem.id, itemId), eq(wishListItem.listId, listId), isNull(wishListItem.deletedAt)))
      .get();
    if (!item) throw new Refusal(NO_ITEM, "missing");
    const mine = await tx
      .select({ deletedAt: wishListItemVote.deletedAt })
      .from(wishListItemVote)
      .where(and(eq(wishListItemVote.itemId, itemId), eq(wishListItemVote.userId, userId)))
      .get();
    const deletedAt = mine && !mine.deletedAt ? new Date() : null;
    await tx
      .insert(wishListItemVote)
      .values({ itemId, userId, deletedAt })
      .onConflictDoUpdate({
        target: [wishListItemVote.itemId, wishListItemVote.userId],
        set: { deletedAt, ...touch() },
      });
  });
}
