import "server-only";

import type { FlocPort, Idea } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { castIdeaVote, deleteIdea, saveIdea } from "@/server/ideas/ideas";
import { listIdeas } from "@/server/ideas/ideas-read";
import { addIdeaToDays, renameIdea, restoreIdea, takeIdeaOffDays } from "@/server/ideas/idea-writes";

type IdeasPort = Pick<
  FlocPort,
  "listIdeas" | "addIdea" | "voteIdea" | "removeIdea" | "renameIdea" | "restoreIdea" | "addIdeaToDays" | "takeIdeaOffDays"
>;

export const ideasPort: IdeasPort = {
  async listIdeas(viewerId, tripId): Promise<Idea[]> {
    const access = await scoped(viewerId, tripId);
    const rows = await listIdeas(access.trip.id, access.viewer.id);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
      createdBy: row.authorId,
      authorName: row.authorName,
      authorAvatarIcon: row.authorAvatarIcon,
      votes: row.votes,
      mine: row.mine,
    }));
  },

  async addIdea(viewerId, tripId, title, category) {
    const access = await scoped(viewerId, tripId);
    await saveIdea(access.trip.id, access.viewer.id, title, category);
  },

  async voteIdea(viewerId, tripId, ideaId) {
    const access = await scoped(viewerId, tripId);
    await castIdeaVote(access.trip.id, access.viewer.id, ideaId);
  },

  async removeIdea(viewerId, tripId, ideaId) {
    const access = await scoped(viewerId, tripId);
    await deleteIdea(access.trip.id, ideaId);
  },

  async renameIdea(viewerId, tripId, ideaId, title) {
    await renameIdea(await scoped(viewerId, tripId), ideaId, title);
  },

  async restoreIdea(viewerId, tripId, ideaId) {
    await restoreIdea(await scoped(viewerId, tripId), ideaId);
  },

  async addIdeaToDays(viewerId, tripId, ideaId, dayId, time) {
    await addIdeaToDays(await scoped(viewerId, tripId), ideaId, dayId, time);
  },

  async takeIdeaOffDays(viewerId, tripId, ideaId) {
    await takeIdeaOffDays(await scoped(viewerId, tripId), ideaId);
  },
};
