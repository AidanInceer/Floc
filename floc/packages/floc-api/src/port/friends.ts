/** The friends half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";

/**
 * Where a friendship stands, from the viewer's end (ticket 96).
 *
 * "outgoing" and "incoming" are the same row read from opposite ends, and they
 * are never merged: a request you sent and one waiting on you are different
 * buttons, and a client that cannot tell them apart draws the wrong one.
 */
export type FriendState = "none" | "friends" | "outgoing" | "incoming";

export type FriendPerson = {
  id: string;
  name: string;
  avatarIcon: AvatarIcon | null;
};

/** The Friends screen in one read (ticket 18). */
export type FriendsBoard = {
  friends: FriendPerson[];
  /** Waiting on the viewer to answer. `id` is the requester. */
  incoming: FriendPerson[];
  /** Sent by the viewer, not yet answered. `id` is the person asked. */
  outgoing: FriendPerson[];
  /** The viewer's own friend code, to hand out (#360). */
  code: string;
};

export type FoundFriend = FriendPerson & { state: FriendState };

/**
 * One search box, two readings (#360). A name only reaches people already in
 * the viewer's rings or a public friend of a friend. There is no lookup by
 * email address: any answer to one says whether it is an account.
 */
export type FriendSearch =
  | { kind: "people"; people: FoundFriend[] }
  | { kind: "code"; code: string; person: FoundFriend | null }
  | { kind: "invalid" };

export type FriendsPort = {
  /** All three lists in one read; the screen draws all three, and asking thrice is three round trips. */
  loadFriends(viewerId: string): Promise<FriendsBoard>;

  /**
   * Opens a request. The target id is never trusted alone — the host re-checks
   * they are inside one of the viewer's rings or a public friend of a friend,
   * or this becomes "is this a real account?" for any id posted (ticket 46).
   * Refusals are silent by design.
   */
  requestFriend(viewerId: string, targetId: string): Promise<void>;

  findFriends(viewerId: string, query: string): Promise<FriendSearch>;

  requestFriendByCode(viewerId: string, code: string): Promise<void>;

  acceptFriend(viewerId: string, requesterId: string): Promise<void>;

  declineFriend(viewerId: string, requesterId: string): Promise<void>;

  /** The same write as declining, from the other end of the pair. */
  cancelFriendRequest(viewerId: string, targetId: string): Promise<void>;

  removeFriend(viewerId: string, otherId: string): Promise<void>;
};
