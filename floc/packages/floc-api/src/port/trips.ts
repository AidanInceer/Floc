import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { CopyChoice } from "@floc/core/trip/explore/copy/copy-choice";
import type { TripRole, TripSummary } from "../port-trips";
import type { FriendPerson } from "./friends";

export type TripMember = {
  userId: string;
  role: TripRole;
  name: string;
  avatarIcon: AvatarIcon | null;
  tone: string;
};

export type TripDetail = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  mark: string | null;
  archived: boolean;
  role: TripRole;
  members: TripMember[];
  bookingPrefill: boolean;
};

export type NewTrip = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  friendIds?: string[] | undefined;
  groupIds?: number[] | undefined;
  places?: string[] | undefined;
};

export type TripPatch = {
  name?: string | undefined;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  colorKey?: string | null | undefined;
  mark?: string | null | undefined;
  tags?: string[] | null | undefined;
};

export type PendingTripInvite = {
  tripId: number;
  tripName: string;
  startDate: string | null;
  endDate: string | null;
  fromName: string;
  fromAvatarIcon: AvatarIcon | null;
};

export type InvitePreview = {
  name: string;
  startDate: string | null;
  endDate: string | null;
  hostName: string | null;
};

export type TripInvites = {
  token: string;
  pending: FriendPerson[];
  candidates: FriendPerson[];
};

export type TripsPort = {
  listTrips(viewerId: string, options: { archived: boolean }): Promise<TripSummary[]>;

  setTripStarred(viewerId: string, tripId: number, starred: boolean): Promise<void>;

  setTripMuted(viewerId: string, tripId: number, muted: boolean): Promise<void>;

  loadTrip(viewerId: string, tripId: number): Promise<TripDetail | null>;

  createTrip(viewerId: string, input: NewTrip): Promise<{ id: number }>;

  startTripFromPreset(viewerId: string, choice: CopyChoice, along?: string[]): Promise<{ id: number } | null>;

  updateTrip(viewerId: string, tripId: number, patch: TripPatch): Promise<void>;

  archiveTrip(viewerId: string, tripId: number, archived: boolean): Promise<void>;

  leaveTrip(viewerId: string, tripId: number): Promise<void>;

  removeMember(viewerId: string, tripId: number, userId: string): Promise<void>;

  promoteMember(viewerId: string, tripId: number, userId: string): Promise<void>;

  joinByToken(viewerId: string, token: string): Promise<{ id: number } | null>;

  resetInviteLink(viewerId: string, tripId: number): Promise<string>;

  loadTripInvites(viewerId: string, tripId: number): Promise<TripInvites>;

  inviteToTrip(viewerId: string, tripId: number, userIds: string[]): Promise<number>;

  listMyInvites(viewerId: string): Promise<PendingTripInvite[]>;

  acceptTripInvite(viewerId: string, tripId: number): Promise<void>;

  declineTripInvite(viewerId: string, tripId: number): Promise<void>;

  previewInvite(token: string): Promise<InvitePreview | null>;

  deleteTrip(viewerId: string, tripId: number): Promise<void>;
};
