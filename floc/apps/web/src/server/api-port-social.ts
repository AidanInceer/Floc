/**
 * The port's social half — friends, other people's profiles, and being asked
 * onto a trip (tickets 18, 46, 146; split out of `api-port.ts`).
 *
 * ONE PERMISSION MODEL, NOT TWO. Every decision about who may see or ask what
 * is delegated: `relationTo` and `requireProfileView` for profiles,
 * `assertAdmin` for inviting, `listFriendsFor` for who may be offered. Restating
 * any of them here is how the phone quietly grows a looser set of rules than
 * the browser has.
 *
 * SILENCE IS THE REFUSAL. A request to somebody outside every ring, a profile
 * that is none of the viewer's business, and an id that was never an account
 * all answer the same way — nothing, or null. A refusal that named its reason
 * would turn these into a way to test whether an account exists (ticket 46).
 */
import "server-only";

import { after } from "next/server";

import type {
  FlocPort,
  FriendPerson,
  FriendsBoard,
  InvitePreview,
  PendingTripInvite,
  PublicProfileView,
  TripInvites,
} from "@floc/api/port";

import { assertAdmin } from "@/server/access";
import { scoped } from "@/server/api-port-scope";
import { emails, sendEmails } from "@/server/email";
import {
  acceptPendingRequest,
  dropFriendship,
  dropPendingRequest,
  findUserById,
  friendStateWith,
  friendshipBetween,
  listFriendsFor,
  listFriendshipsFor,
  openPendingRequest,
  peopleByIds,
  syncCompletedCoTripFriendships,
  type Person,
} from "@/server/friends";
import { loadIdentity } from "@/server/profile";
import { refresh } from "@/server/freshness";
import {
  acceptInvite,
  declineInvite,
  findTripByInviteToken,
  inviteToTrip,
  listPendingInvitees,
  listPendingInvitesFor,
} from "@/server/invites";
import { relationTo, requireProfileView } from "@/server/visibility";

type SocialPort = Pick<
  FlocPort,
  | "loadFriends"
  | "requestFriend"
  | "acceptFriend"
  | "declineFriend"
  | "cancelFriendRequest"
  | "removeFriend"
  | "loadProfileOf"
  | "loadTripInvites"
  | "inviteToTrip"
  | "listMyInvites"
  | "acceptTripInvite"
  | "declineTripInvite"
  | "previewInvite"
>;

/** A row whose person has since gone still has to draw as something. */
const UNKNOWN = (id: string): Person => ({ id, name: "Someone", avatarUrl: null });

function toPerson(p: Person): FriendPerson {
  return { id: p.id, name: p.name, avatarUrl: p.avatarUrl };
}

/**
 * A side effect that must not take the request down with it (rule 11).
 *
 * `after` runs the work once the response is out, which is what a
 * notification wants — but it THROWS when there is no request scope, and the
 * port is called from places that have none (a test, a script, anything that
 * is not a route handler). Losing the mail is a degraded feature; losing the
 * friend request that was already written is a lie told to the person who
 * asked. So the scope is the optional half, not the write.
 */
function notify(work: () => Promise<unknown>): void {
  try {
    after(work);
  } catch {
    void work();
  }
}

export const socialPort: SocialPort = {
  async loadFriends(viewerId): Promise<FriendsBoard> {
    // Lazy reconciliation, exactly as the web page does it: v1 has no cron, so
    // a finished co-trip becomes a friendship the next time either end looks.
    await syncCompletedCoTripFriendships(viewerId);

    const rows = await listFriendshipsFor(viewerId);
    const otherIdOf = (r: (typeof rows)[number]) =>
      r.userId === viewerId ? r.friendId : r.userId;

    // Every face in one query — this was an await inside a map, so a hundred
    // friends was a hundred serial round trips (ticket 118).
    const people = await peopleByIds(rows.map(otherIdOf));
    const personFor = (id: string) => toPerson(people.get(id) ?? UNKNOWN(id));

    return {
      friends: rows
        .filter((r) => r.status === "accepted")
        .map((r) => personFor(otherIdOf(r))),
      // Which end of the pair the viewer is at is what tells these apart.
      incoming: rows
        .filter((r) => r.status === "pending" && r.friendId === viewerId)
        .map((r) => personFor(r.userId)),
      outgoing: rows
        .filter((r) => r.status === "pending" && r.userId === viewerId)
        .map((r) => personFor(r.friendId)),
    };
  },

  async requestFriend(viewerId, targetId) {
    if (!targetId || targetId === viewerId) return;

    // The id is never trusted alone (ticket 46): without this, posting any id
    // answers "is that a real account?" through the side effect.
    const relation = await relationTo(viewerId, targetId);
    if (!relation || relation === "self") return;

    const target = await findUserById(targetId);
    if (!target) return;
    // Already friends, or a request already sitting one way — refuse quietly.
    if (await friendshipBetween(viewerId, target.id)) return;

    // The display name, not the signup name — the same one the web signs
    // the mail with.
    const me = await loadIdentity(viewerId);
    await openPendingRequest(viewerId, target.id);

    notify(() =>
      sendEmails([
        emails.friendRequest({
          to: target.email,
          toUserId: target.id,
          fromName: me?.name ?? "Someone",
        }),
      ]),
    );

    refresh({ kind: "friendship", otherId: target.id });
  },

  async acceptFriend(viewerId, requesterId) {
    await acceptPendingRequest(requesterId, viewerId);
    refresh({ kind: "friendship", otherId: requesterId });
  },

  async declineFriend(viewerId, requesterId) {
    await dropPendingRequest(requesterId, viewerId);
    refresh({ kind: "friendship", otherId: requesterId });
  },

  async cancelFriendRequest(viewerId, targetId) {
    // The same write as declining, from the other end of the pair.
    await dropPendingRequest(viewerId, targetId);
    refresh({ kind: "friendship", otherId: targetId });
  },

  async removeFriend(viewerId, otherId) {
    await dropFriendship(viewerId, otherId);
    refresh({ kind: "friendship", otherId });
  },

  async loadProfileOf(viewerId, userId): Promise<PublicProfileView | null> {
    // Your own face is not this endpoint's job — `me.profile` is, and that one
    // is writable where this is not.
    if (userId === viewerId) return null;

    // Asked first so a stranger comes back as null rather than as a
    // `notFound()` thrown out of a route handler that cannot catch it.
    const relation = await relationTo(viewerId, userId);
    if (!relation || relation === "self") return null;

    const [profile, friendState] = await Promise.all([
      requireProfileView(userId, viewerId),
      friendStateWith(viewerId, userId),
    ]);

    return {
      userId: profile.userId,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      relation: profile.relation === "friend" ? "friend" : "co_traveller",
      isPrivate: profile.isPrivate,
      vibeTags: profile.vibeTags,
      // Codes and states only — both clients hold `@floc/core/countries`, so
      // the names would be sending what the reader already has.
      map: profile.travelMap
        ? Object.entries(profile.travelMap.states).map(([code, state]) => ({
            code,
            state,
          }))
        : null,
      been: profile.travelMap ? profile.travelMap.visited : null,
      wantToGo: profile.travelMap ? profile.travelMap.wantToGo : null,
      // `place` is dropped: the phone draws a name and a date range, and a
      // field nothing draws is a field that goes stale unnoticed.
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
    assertAdmin(access);

    const [friends, pending] = await Promise.all([
      // Accepted friends only: offering somebody who has not agreed to know you
      // would make a trip invite a backdoor friend request (ticket 146).
      listFriendsFor(viewerId),
      listPendingInvitees(tripId),
    ]);

    const asked = new Set(pending.map((p) => p.userId));
    const onRoster = new Set(access.members.map((m) => m.userId));

    return {
      token: access.trip.inviteToken,
      pending: pending.map((p) => ({
        id: p.userId,
        name: p.name,
        avatarUrl: p.avatarUrl,
      })),
      candidates: friends
        .filter((f) => !asked.has(f.id) && !onRoster.has(f.id))
        .map(toPerson),
    };
  },

  async inviteToTrip(viewerId, tripId, userIds): Promise<number> {
    const access = await scoped(viewerId, tripId);
    assertAdmin(access);

    // In-app only, like the web (ticket 146): the invitee sees it on their next
    // trips load. No mail, so nothing here is a way to email a stranger.
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
      fromAvatarUrl: r.fromAvatarUrl,
    }));
  },

  async acceptTripInvite(viewerId, tripId) {
    // Accepting is one operation, not a sequence each caller gets right: it
    // revives a kicked row, lazily makes a profile, and answers the invite.
    await acceptInvite(tripId, viewerId);
    refresh({ kind: "tripList" }, { kind: "invites" });
  },

  async declineTripInvite(viewerId, tripId) {
    await declineInvite(tripId, viewerId);
    refresh({ kind: "invites" });
  },

  async previewInvite(token): Promise<InvitePreview | null> {
    // No viewer: the point of a share link is that it reads before you are
    // anybody. Nothing in it is a member's to know (ticket 147).
    const found = await findTripByInviteToken(token);
    if (!found) return null;
    return {
      name: found.name,
      startDate: found.startDate,
      endDate: found.endDate,
      hostName: found.hostName,
    };
  },
};
