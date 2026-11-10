/** The trips half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { CopyChoice } from "@floc/core/trip/explore/copy/copy-choice";
import type { TripRole, TripSummary } from "../port-trips";
import type { FriendPerson } from "./friends";

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  avatarIcon: AvatarIcon | null;
  /** Roster seat colour, assigned from the name — a token name, not a hex. */
  tone: string;
};

/** One trip and everything a client needs before it can render any tab of it. */
export type TripDetail = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  /** The chosen mark, or null for the pastel alone (#318). Never a URL. */
  mark: string | null;
  archived: boolean;
  /** The viewer's own role, so a client can hide what `assertAdmin` would refuse anyway. */
  role: TripRole;
  members: TripMember[];
  /** Pro: booking links arrive with the place and dates filled in. */
  bookingPrefill: boolean;
};

export type NewTrip = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  friendIds?: string[] | undefined;
  groupIds?: number[] | undefined;
};

/** Every field is optional and may arrive as an explicit `undefined` — the wire omits what it isn't changing. */
export type TripPatch = {
  name?: string | undefined;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  colorKey?: string | null | undefined;
  mark?: string | null | undefined;
  tags?: string[] | null | undefined;
};

/** One trip the viewer has been asked onto by name (ticket 146). */
export type PendingTripInvite = {
  tripId: number;
  tripName: string;
  startDate: string | null;
  endDate: string | null;
  fromName: string;
  fromAvatarIcon: AvatarIcon | null;
};

/**
 * What a share link is worth before you walk through it (ticket 05).
 *
 * Deliberately thin: a name, some dates and whose trip it is. No roster, no
 * money, no notes — whoever holds a forwarded link is not a member yet, and
 * this is read without a session.
 */
export type InvitePreview = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  hostName: string | null;
};

/** The invite panel on a trip: the forwardable link, and who has been asked. */
export type TripInvites = {
  /** The trip's unguessable share token — never its id (ticket 05). */
  token: string;
  /** Already asked, so the picker does not offer the same person twice. */
  pending: FriendPerson[];
  /** The viewer's friends, minus the roster and minus `pending`. */
  candidates: FriendPerson[];
};

export type TripsPort = {
  // The viewer's trips. Never another user's, whatever id is passed.
  listTrips(viewerId: string, options: { archived: boolean }): Promise<TripSummary[]>;

  /** Stars the trip for the viewer alone. Any member may (not an admin power). */
  setTripStarred(viewerId: string, tripId: number, starred: boolean): Promise<void>;

  setTripMuted(viewerId: string, tripId: number, muted: boolean): Promise<void>;

  /** Null when the trip does not exist OR the viewer is not a member — the same answer for both (rule 5). */
  loadTrip(viewerId: string, tripId: number): Promise<TripDetail | null>;

  createTrip(viewerId: string, input: NewTrip): Promise<{ id: number }>;

  /**
   * Starts a trip from an Explore listing (ADR-025), copied, never linked.
   * Null when the listing has been retired since it was drawn (rule 11).
   */
  startTripFromPreset(viewerId: string, choice: CopyChoice): Promise<{ id: number } | null>;

  updateTrip(viewerId: string, tripId: number, patch: TripPatch): Promise<void>;

  /** Admin-only on the host side (rule 6). */
  archiveTrip(viewerId: string, tripId: number, archived: boolean): Promise<void>;

  /** Any member may leave; only an admin may remove somebody else (rule 6). */
  leaveTrip(viewerId: string, tripId: number): Promise<void>;

  removeMember(viewerId: string, tripId: number, userId: string): Promise<void>;

  promoteMember(viewerId: string, tripId: number, userId: string): Promise<void>;

  /** Joining by the trip's share token — never by its id (ticket 05). */
  joinByToken(viewerId: string, token: string): Promise<{ id: number } | null>;

  /**
   * Re-locks the trip and answers the new token (#358). Admin-only on the host
   * side (rule 6): handing the link out is any member's, cancelling every copy
   * already sent is not. The old token then reads as a bad one, not a revoked
   * one (rule 5).
   */
  resetInviteLink(viewerId: string, tripId: number): Promise<string>;

  /** The link, who has been asked, and who is left to ask. Admin-only on the host (rule 6). */
  loadTripInvites(viewerId: string, tripId: number): Promise<TripInvites>;

  /** Asks people by name. Anyone already on the roster is dropped rather than refused — an ordinary mistake. */
  inviteToTrip(viewerId: string, tripId: number, userIds: string[]): Promise<number>;

  /** Trips the viewer has been asked onto and not yet answered. Empty is ordinary. */
  listMyInvites(viewerId: string): Promise<PendingTripInvite[]>;

  acceptTripInvite(viewerId: string, tripId: number): Promise<void>;

  declineTripInvite(viewerId: string, tripId: number): Promise<void>;

  /**
   * What a share link is worth, read WITHOUT a session (ticket 05) — the point
   * of the link is that it works before you are anybody. Null for a bad or
   * retired token, never an error naming what was wrong.
   */
  previewInvite(token: string): Promise<InvitePreview | null>;

  /** Admin-only, any stage, no undo — a soft delete (rule 8). */
  deleteTrip(viewerId: string, tripId: number): Promise<void>;
};
