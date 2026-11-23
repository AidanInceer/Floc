import "server-only";

import type {
  FlocPort,
  FriendGroup,
  FriendPerson,
  FriendSearch,
  FriendsBoard,
  InvitePreview,
  PastTripPeople,
  PendingTripInvite,
  PublicProfileView,
  TripInvites,
} from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import {
  acceptPendingRequest,
  cancelFriendRequest,
  declineFriendRequest,
  dropFriendship,
  friendStateWith,
  listFriendsFor,
  listFriendshipsFor,
  peopleByIds,
  splitFriendships,
  syncCompletedCoTripFriendships,
  type Person,
} from "@/server/social/friends";
import { requestFriend } from "@/server/social/find-friends";
import { friendCodeFor, requestByCode } from "@/server/social/friend-code";
import { searchFriends } from "@/server/social/friend-search";
import {
  createGroup,
  deleteGroup,
  listGroupsFor,
  listPastTripsFor,
  saveGroup,
  setGroupMember,
} from "@/server/social/groups";
import { refresh } from "@/server/freshness";
import { today } from "@floc/core/dates/dates";
import {
  acceptInvite,
  declineInvite,
  findTripByShareLink,
  inviteToTrip,
  listPendingInvitees,
  listPendingInvitesFor,
} from "@/server/trips/invites";
import { mintShareToken } from "@/server/trips/invite-link";
import { relationTo, requireProfileView } from "@/server/auth/visibility";

type SocialPort = Pick<
  FlocPort,
  | "loadFriends"
  | "requestFriend"
  | "findFriends"
  | "requestFriendByCode"
  | "acceptFriend"
  | "declineFriend"
  | "cancelFriendRequest"
  | "removeFriend"
  | "loadGroups"
  | "loadPastTripPeople"
  | "createGroup"
  | "saveGroup"
  | "setGroupMember"
  | "deleteGroup"
  | "loadProfileOf"
  | "loadTripInvites"
  | "inviteToTrip"
  | "listMyInvites"
  | "acceptTripInvite"
  | "declineTripInvite"
  | "previewInvite"
>;

const UNKNOWN = (id: string): Person => ({ id, name: "Someone", avatarIcon: null });

function toPerson(p: Person): FriendPerson {
  return { id: p.id, name: p.name, avatarIcon: p.avatarIcon };
}

export const socialPort: SocialPort = {
  async loadFriends(viewerId): Promise<FriendsBoard> {
    await syncCompletedCoTripFriendships(viewerId);

    const [rows, code] = await Promise.all([
      listFriendshipsFor(viewerId),
      friendCodeFor(viewerId),
    ]);
    const otherIdOf = (r: (typeof rows)[number]) =>
      r.userId === viewerId ? r.friendId : r.userId;

    const people = await peopleByIds(rows.map(otherIdOf));
    const personFor = (id: string) => toPerson(people.get(id) ?? UNKNOWN(id));
    const { accepted, incoming, outgoing } = splitFriendships(rows, viewerId);

    return {
      friends: accepted.map((r) => personFor(otherIdOf(r))),
      incoming: incoming.map((r) => personFor(otherIdOf(r))),
      outgoing: outgoing.map((r) => personFor(otherIdOf(r))),
      code,
    };
  },

  async requestFriend(viewerId, targetId) {
    await requestFriend(viewerId, targetId);
  },

  async findFriends(viewerId, query): Promise<FriendSearch> {
    return searchFriends(viewerId, query);
  },

  async requestFriendByCode(viewerId, code) {
    await requestByCode(viewerId, code);
  },

  acceptFriend: (viewerId, requesterId) => acceptPendingRequest(requesterId, viewerId),

  declineFriend: (viewerId, requesterId) => declineFriendRequest(viewerId, requesterId),

  cancelFriendRequest: (viewerId, targetId) => cancelFriendRequest(viewerId, targetId),

  removeFriend: (viewerId, otherId) => dropFriendship(viewerId, otherId),

  async loadGroups(viewerId): Promise<FriendGroup[]> {
    const groups = await listGroupsFor(viewerId);
    return groups.map((g) => ({ id: g.id, name: g.name, members: g.members.map(toPerson) }));
  },

  async loadPastTripPeople(viewerId): Promise<PastTripPeople[]> {
    const trips = await listPastTripsFor(viewerId, today());
    return trips.map((t) => ({ ...t, people: t.people.map(toPerson) }));
  },

  createGroup: (viewerId, input) => createGroup(viewerId, input),

  saveGroup: (viewerId, groupId, input) => saveGroup(viewerId, groupId, input),

  setGroupMember: (viewerId, groupId, userId, on) => setGroupMember(viewerId, groupId, userId, on),

  deleteGroup: (viewerId, groupId) => deleteGroup(viewerId, groupId),

  async loadProfileOf(viewerId, userId): Promise<PublicProfileView | null> {
    if (userId === viewerId) return null;

    const relation = await relationTo(viewerId, userId);
    if (!relation || relation === "self") return null;

    const [profile, friendState] = await Promise.all([
      requireProfileView(userId, viewerId),
      friendStateWith(viewerId, userId),
    ]);

    return {
      userId: profile.userId,
      name: profile.name,
      avatarIcon: profile.avatarIcon,
      relation: profile.relation === "friend" ? "friend" : "co_traveller",
      isPrivate: profile.isPrivate,
      vibeTags: profile.vibeTags,
      map: profile.travelMap
        ? Object.entries(profile.travelMap.states).map(([code, state]) => ({
            code,
            state,
          }))
        : null,
      been: profile.travelMap ? profile.travelMap.visited : null,
      wantToGo: profile.travelMap ? profile.travelMap.wantToGo : null,
      saved: profile.saved,
      pastTrips:
        profile.pastTrips?.map((t) => ({
          id: t.id,
          name: t.name,
          startDate: t.startDate,
          endDate: t.endDate,
        })) ?? null,
      friendState,
    };
  },

  async loadTripInvites(viewerId, tripId): Promise<TripInvites> {
    const access = await scoped(viewerId, tripId);

    const [friends, pending] = await Promise.all([
      listFriendsFor(viewerId),
      listPendingInvitees(tripId),
    ]);

    const asked = new Set(pending.map((p) => p.userId));
    const onRoster = new Set(access.members.map((m) => m.userId));

    return {
      token: mintShareToken(access.trip.inviteToken),
      pending: pending.map((p) => ({
        id: p.userId,
        name: p.name,
        avatarIcon: p.avatarIcon,
      })),
      candidates: friends
        .filter((f) => !asked.has(f.id) && !onRoster.has(f.id))
        .map(toPerson),
    };
  },

  async inviteToTrip(viewerId, tripId, userIds): Promise<number> {
    await scoped(viewerId, tripId);

    const sent = await inviteToTrip({
      tripId,
      fromUserId: viewerId,
      toUserIds: userIds,
    });

    refresh({ kind: "tripOverview", tripId }, { kind: "invites" });
    return sent;
  },

  async listMyInvites(viewerId): Promise<PendingTripInvite[]> {
    const rows = await listPendingInvitesFor(viewerId);
    return rows.map((r) => ({
      tripId: r.tripId,
      tripName: r.tripName,
      startDate: r.startDate,
      endDate: r.endDate,
      fromName: r.fromName,
      fromAvatarIcon: r.fromAvatarIcon,
    }));
  },

  async acceptTripInvite(viewerId, tripId) {
    await acceptInvite(tripId, viewerId);
  },

  declineTripInvite: (viewerId, tripId) => declineInvite(tripId, viewerId),

  async previewInvite(token): Promise<InvitePreview | null> {
    const found = await findTripByShareLink(token);
    if (!found) return null;
    return {
      name: found.name,
      startDate: found.startDate,
      endDate: found.endDate,
      hostName: found.hostName,
    };
  },
};
