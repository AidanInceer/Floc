import type { AvatarIcon } from "@floc/core/people/avatar-icon";

export type Idea = {
  id: number;
  title: string;
  createdAt: string;
  createdBy: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  votes: number;
  mine: boolean;
};

export type IdeasPort = {
  listIdeas(viewerId: string, tripId: number): Promise<Idea[]>;

  addIdea(viewerId: string, tripId: number, title: string): Promise<void>;

  voteIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;

  removeIdea(viewerId: string, tripId: number, ideaId: number): Promise<void>;
};
