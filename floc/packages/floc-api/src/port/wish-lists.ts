import type { WishItemInput, WishItemKind } from "@floc/core/lists/wish-list";

import type { FriendPerson } from "./friends";

export type WishListSummary = { id: number; title: string; people: FriendPerson[]; itemCount: number };
export type WishListInvite = { id: number; title: string; from: FriendPerson | null };

export type WishListItem = {
  id: number;
  kind: WishItemKind;
  presetId: string | null;
  countryCode: string | null;
  text: string | null;
  url: string | null;
  label: string | null;
  addedBy: FriendPerson | null;
  votes: number;
  voted: boolean;
};

export type WishListDetail = {
  id: number;
  name: string | null;
  title: string;
  members: FriendPerson[];
  invited: FriendPerson[];
  items: WishListItem[];
};

export type WishListsPort = {
  loadWishLists(viewerId: string): Promise<{ lists: WishListSummary[]; invites: WishListInvite[] }>;
  loadWishList(viewerId: string, listId: number): Promise<WishListDetail | null>;
  createWishList(viewerId: string, inviteIds: string[]): Promise<number>;
  startWishListWith(viewerId: string, friendId: string): Promise<number>;
  inviteToWishList(viewerId: string, listId: number, inviteIds: string[]): Promise<number>;
  respondToWishInvite(viewerId: string, listId: number, accept: boolean): Promise<void>;
  leaveWishList(viewerId: string, listId: number): Promise<void>;
  renameWishList(viewerId: string, listId: number, name: string): Promise<void>;
  addWishItem(viewerId: string, listId: number, item: WishItemInput): Promise<number>;
  removeWishItem(viewerId: string, listId: number, itemId: number): Promise<void>;
  toggleWishVote(viewerId: string, listId: number, itemId: number): Promise<void>;
  wishListPeopleToAsk(viewerId: string, listId: number): Promise<FriendPerson[]>;
};
