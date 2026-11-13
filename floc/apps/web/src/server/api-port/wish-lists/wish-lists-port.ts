/**
 * The port's wish lists half (#623, ADR-049). NOT A TRIP SURFACE: every call goes through `server/wish-lists`, which
 * checks the caller's seat on the list itself, so a list you are not on is not addressable.
 */
import "server-only";

import type { FlocPort } from "@floc/api/port";

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
import { listWishListsFor, wishListFor, wishListPeopleToAsk } from "@/server/wish-lists/wish-lists";

type WishListsPort = Pick<
  FlocPort,
  | "loadWishLists"
  | "loadWishList"
  | "createWishList"
  | "startWishListWith"
  | "inviteToWishList"
  | "respondToWishInvite"
  | "leaveWishList"
  | "renameWishList"
  | "addWishItem"
  | "removeWishItem"
  | "wishListPeopleToAsk"
>;

async function changed<T>(write: Promise<T>, inbox = false): Promise<T> {
  const out = await write;
  refresh({ kind: "wishLists" });
  if (inbox) refresh({ kind: "inbox" });
  return out;
}

export const wishListsPort: WishListsPort = {
  loadWishLists: (viewerId) => listWishListsFor(viewerId),
  loadWishList: (viewerId, listId) => wishListFor(viewerId, listId),
  createWishList: (viewerId, inviteIds) => changed(createWishList(viewerId, { inviteIds }), true),
  startWishListWith: (viewerId, friendId) => changed(startWishListWith(viewerId, friendId), true),
  inviteToWishList: (viewerId, listId, inviteIds) => changed(inviteToWishList(viewerId, listId, inviteIds), true),
  respondToWishInvite: (viewerId, listId, accept) => changed(respondToWishInvite(viewerId, listId, accept), true),
  leaveWishList: (viewerId, listId) => changed(leaveWishList(viewerId, listId)),
  renameWishList: (viewerId, listId, name) => changed(renameWishList(viewerId, listId, name)),
  addWishItem: (viewerId, listId, item) => changed(addWishItem(viewerId, listId, item)),
  removeWishItem: (viewerId, listId, itemId) => changed(removeWishItem(viewerId, listId, itemId)),
  wishListPeopleToAsk: (viewerId, listId) => wishListPeopleToAsk(viewerId, listId),
};
