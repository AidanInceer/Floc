import type { AvatarIcon } from "@floc/core/people/avatar-icon";

export type Idea = {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  votes: number;
  mine: boolean;
};

export type IdeasPort = {
  listIdeas(viewerId: string, tripId: number): Promise<Idea[]>;

  addIdea(viewerId: string, tripId: number, title: string, category?: string): Promise<void>;

  voteIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;

  removeIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;

  renameIdea(viewerId: string, tripId: number, ideaId: number, title: string): Promise<void>;

  restoreIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;

  addIdeaToDays(viewerId: string, tripId: number, ideaId: number, dayId: number, time: string | null): Promise<void>;

  takeIdeaOffDays(viewerId: string, tripId: number, ideaId: number): Promise<void>;
};
