"use server";

import { orRefusal } from "@floc/core/errors/refusal";

import { requireUser } from "@/server/access";
import { startWishListWith } from "@/server/wish-lists/wish-list-start";
import { toggleWishVote } from "@/server/wish-lists/wish-list-votes";
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

async function asWishWrite(write: (viewerId: string) => Promise<number | void>): Promise<WishOutcome> {
  const viewer = await requireUser("/lists/wish");
  return orRefusal(async () => {
    const id = await write(viewer.id);
    return typeof id === "number" ? { id } : {};
  });
}

export async function createWishListAction(inviteIds: string[]): Promise<WishOutcome> {
  return asWishWrite((me) => createWishList(me, { inviteIds }));
}

export async function startWishListWithAction(friendId: string): Promise<WishOutcome> {
  return asWishWrite((me) => startWishListWith(me, friendId));
}

export async function inviteToWishListAction(listId: number, inviteIds: string[]): Promise<WishOutcome> {
  return asWishWrite((me) => inviteToWishList(me, listId, inviteIds));
}

export async function respondToWishInviteAction(listId: number, accept: boolean): Promise<WishOutcome> {
  return asWishWrite(async (me) => {
    await respondToWishInvite(me, listId, accept);
    return accept ? listId : undefined;
  });
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

export async function toggleWishVoteAction(listId: number, itemId: number): Promise<WishOutcome> {
  return asWishWrite((me) => toggleWishVote(me, listId, itemId));
}
