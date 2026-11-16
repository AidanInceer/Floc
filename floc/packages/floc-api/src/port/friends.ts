import type { AvatarIcon } from "@floc/core/people/avatar-icon";

export type FriendState = "none" | "friends" | "outgoing" | "incoming";

export type FriendPerson = {
  id: string;
  name: string;
  avatarIcon: AvatarIcon | null;
};

export type FriendsBoard = {
  friends: FriendPerson[];
  incoming: FriendPerson[];
  outgoing: FriendPerson[];
  code: string;
};

export type FoundFriend = FriendPerson & { state: FriendState };

export type FriendSearch =
  | { kind: "people"; people: FoundFriend[] }
  | { kind: "code"; code: string; person: FoundFriend | null; limited?: true }
  | { kind: "invalid" };

export type FriendGroup = { id: number; name: string; members: FriendPerson[] };

export type PastTripPeople = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string;
  people: FriendPerson[];
};

export type GroupInput = { name: string; memberIds: string[] };

export type FriendsPort = {
  loadFriends(viewerId: string): Promise<FriendsBoard>;

  requestFriend(viewerId: string, targetId: string): Promise<void>;

  findFriends(viewerId: string, query: string): Promise<FriendSearch>;

  requestFriendByCode(viewerId: string, code: string): Promise<void>;

  acceptFriend(viewerId: string, requesterId: string): Promise<void>;

  declineFriend(viewerId: string, requesterId: string): Promise<void>;

  cancelFriendRequest(viewerId: string, targetId: string): Promise<void>;

  removeFriend(viewerId: string, otherId: string): Promise<void>;

  loadGroups(viewerId: string): Promise<FriendGroup[]>;

  loadPastTripPeople(viewerId: string): Promise<PastTripPeople[]>;

  createGroup(viewerId: string, input: GroupInput): Promise<number>;

  saveGroup(viewerId: string, groupId: number, input: GroupInput): Promise<void>;

  setGroupMember(viewerId: string, groupId: number, userId: string, on: boolean): Promise<void>;

  deleteGroup(viewerId: string, groupId: number): Promise<void>;
};
