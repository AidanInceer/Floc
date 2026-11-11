/** The ideas half of the port (#573). The rules it carries are listed in `../port.ts`. */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";

// One idea for the trip, with its tally. `createdAt` is an instant, as a string — a `Date` does
// not survive JSON.
export type Idea = {
  id: number;
  title: string;
  createdAt: string;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  votes: number;
  /** Whether the caller has voted for it. */
  mine: boolean;
};

export type IdeasPort = {
  /** The trip's ideas, newest first; the client orders them for reading. */
  listIdeas(viewerId: string, tripId: number): Promise<Idea[]>;

  /** Any member may add one. The title is capped, never rejected for length. */
  addIdea(viewerId: string, tripId: number, title: string): Promise<void>;

  /** Toggles — voting again takes the vote back. One vote per person. */
  voteIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;

  /** Any member may remove any idea: it is the group's, and this is not a fourth admin power (rule 6). */
  removeIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;
};
