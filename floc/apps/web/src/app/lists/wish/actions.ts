"use server";

/** Wish list writes from the web (#623, ADR-049). The rules live in `server/wish-lists`; this only signs in and refreshes. */
import { isRefusal } from "@floc/core/errors/refusal";

import { requireUser } from "@/server/access";
import { refresh } from "@/server/freshness";
import { startWishListWith } from "@/server/wish-lists/wish-list-start";
import {
  addWishItem,
  createWishList,
  inviteToWishList,
  leaveWishList,
  removeWishItem,
  renameWishList,
  respondToWishInvite,
} from "@/server/wish-lists/wish-list-writes";

export type WishOutcome = { error?: string; id?: number };

async function asWishWrite(write: (viewerId: string) => Promise<number | void>, alsoInbox = false): Promise<WishOutcome> {
  const viewer = await requireUser("/lists/wish");
  try {
    const id = await write(viewer.id);
    refresh({ kind: "wishLists" });
    if (alsoInbox) refresh({ kind: "inbox" });
    return typeof id === "number" ? { id } : {};
  } catch (error) {
    if (isRefusal(error)) return { error: error.message };
    throw error;
  }
}

export async function createWishListAction(inviteIds: string[]): Promise<WishOutcome> {
  return asWishWrite((me) => createWishList(me, { inviteIds }), true);
}

export async function startWishListWithAction(friendId: string): Promise<WishOutcome> {
  return asWishWrite((me) => startWishListWith(me, friendId), true);
}

export async function inviteToWishListAction(listId: number, inviteIds: string[]): Promise<WishOutcome> {
  return asWishWrite((me) => inviteToWishList(me, listId, inviteIds), true);
}

export async function respondToWishInviteAction(listId: number, accept: boolean): Promise<WishOutcome> {
  return asWishWrite(async (me) => {
    await respondToWishInvite(me, listId, accept);
    return accept ? listId : undefined;
  }, true);
}

export async function leaveWishListAction(listId: number): Promise<WishOutcome> {
  return asWishWrite((me) => leaveWishList(me, listId));
}

export async function renameWishListAction(listId: number, name: string): Promise<WishOutcome> {
  return asWishWrite((me) => renameWishList(me, listId, name));
}

export async function addWishItemAction(listId: number, item: unknown): Promise<WishOutcome> {
  return asWishWrite((me) => addWishItem(me, listId, item));
}

export async function removeWishItemAction(listId: number, itemId: number): Promise<WishOutcome> {
  return asWishWrite((me) => removeWishItem(me, listId, itemId));
}
