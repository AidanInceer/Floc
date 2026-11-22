import "server-only";

import type { FlocPort, Idea } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { castIdeaVote, deleteIdea, saveIdea } from "@/server/ideas/ideas";
import { listIdeas } from "@/server/ideas/ideas-read";

type IdeasPort = Pick<FlocPort, "listIdeas" | "addIdea" | "voteIdea" | "removeIdea">;

export const ideasPort: IdeasPort = {
  async listIdeas(viewerId, tripId): Promise<Idea[]> {
    const access = await scoped(viewerId, tripId);
    const rows = await listIdeas(access.trip.id, access.viewer.id);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      createdBy: row.authorId,
      authorName: row.authorName,
      authorAvatarIcon: row.authorAvatarIcon,
      votes: row.votes,
      mine: row.mine,
    }));
  },

  async addIdea(viewerId, tripId, title) {
    const access = await scoped(viewerId, tripId);
    await saveIdea(access.trip.id, access.viewer.id, title);
  },

  async voteIdea(viewerId, tripId, ideaId) {
    const access = await scoped(viewerId, tripId);
    await castIdeaVote(access.trip.id, access.viewer.id, ideaId);
  },

  async removeIdea(viewerId, tripId, ideaId) {
    const access = await scoped(viewerId, tripId);
    await deleteIdea(access.trip.id, ideaId);
  },
};
