import "server-only";

import type { FlocPort } from "@floc/api/port";

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
  | "toggleWishVote"
  | "wishListPeopleToAsk"
>;

export const wishListsPort: WishListsPort = {
  loadWishLists: (viewerId) => listWishListsFor(viewerId),
  loadWishList: (viewerId, listId) => wishListFor(viewerId, listId),
  createWishList: (viewerId, inviteIds) => createWishList(viewerId, { inviteIds }),
  startWishListWith: (viewerId, friendId) => startWishListWith(viewerId, friendId),
  inviteToWishList: (viewerId, listId, inviteIds) => inviteToWishList(viewerId, listId, inviteIds),
  respondToWishInvite: (viewerId, listId, accept) => respondToWishInvite(viewerId, listId, accept),
  leaveWishList: (viewerId, listId) => leaveWishList(viewerId, listId),
  renameWishList: (viewerId, listId, name) => renameWishList(viewerId, listId, name),
  addWishItem: (viewerId, listId, item) => addWishItem(viewerId, listId, item),
  removeWishItem: (viewerId, listId, itemId) => removeWishItem(viewerId, listId, itemId),
  toggleWishVote: (viewerId, listId, itemId) => toggleWishVote(viewerId, listId, itemId),
  wishListPeopleToAsk: (viewerId, listId) => wishListPeopleToAsk(viewerId, listId),
};
