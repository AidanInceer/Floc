/**
 * The port's ideas half — the same `server/ideas/` modules the Overview page
 * reads, so an idea added on a phone and one typed in a browser are one row
 * under one set of rules.
 */
import "server-only";

import type { FlocPort, Idea } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { findIdea, insertIdea, softDeleteIdea, toggleIdeaVote } from "@/server/ideas/ideas";
import { listIdeas } from "@/server/ideas/ideas-read";
import { refresh } from "@/server/freshness";

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
    await insertIdea({ tripId: access.trip.id, createdBy: access.viewer.id, title });
    refresh({ kind: "ideas", tripId: access.trip.id });
  },

  async voteIdea(viewerId, tripId, ideaId) {
    const access = await scoped(viewerId, tripId);
    // Re-read inside the trip, so a crafted id cannot reach another trip's idea.
    const target = await findIdea(access.trip.id, ideaId);
    if (!target) return;

    await toggleIdeaVote(target.id, access.viewer.id);
    refresh({ kind: "ideas", tripId: access.trip.id });
  },

  async removeIdea(viewerId, tripId, ideaId) {
    const access = await scoped(viewerId, tripId);
    const target = await findIdea(access.trip.id, ideaId);
    if (!target) return;

    await softDeleteIdea(access.trip.id, target.id);
    refresh({ kind: "ideas", tripId: access.trip.id });
  },
};
