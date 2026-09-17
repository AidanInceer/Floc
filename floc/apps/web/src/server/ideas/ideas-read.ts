/** Reading one trip's ideas with their tally — the overview's first panel. */
import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { idea, ideaVote, user, userProfile } from "@/db/schema";
import { parseAvatarIcon } from "@floc/core/people/avatar-icon";
import type { IdeaRow } from "@floc/core/trip/ideas";
import { bounded, LIMITS } from "@/server/limits";

export async function listIdeas(tripId: number, viewerId: string): Promise<IdeaRow[]> {
  const live = and(eq(idea.tripId, tripId), isNull(idea.deletedAt));

  const [rows, voteRows] = await Promise.all([
    db
      .select({
        id: idea.id,
        title: idea.title,
        createdAt: idea.createdAt,
        authorId: idea.createdBy,
        authorName: user.name,
        authorAvatarIcon: userProfile.avatarIcon,
      })
      .from(idea)
      .innerJoin(user, eq(user.id, idea.createdBy))
      .leftJoin(userProfile, eq(userProfile.userId, idea.createdBy))
      .where(live)
      .orderBy(desc(idea.id))
      .limit(LIMITS.ideas)
      .all(),
    db
      .select({ ideaId: ideaVote.ideaId, userId: ideaVote.userId })
      .from(ideaVote)
      .innerJoin(idea, eq(idea.id, ideaVote.ideaId))
      .where(and(live, isNull(ideaVote.deletedAt)))
      .all(),
  ]);

  const tally = new Map<number, { votes: number; mine: boolean }>();
  for (const v of voteRows) {
    const t = tally.get(v.ideaId) ?? { votes: 0, mine: false };
    t.votes += 1;
    if (v.userId === viewerId) t.mine = true;
    tally.set(v.ideaId, t);
  }

  return bounded(rows, "ideas", `trip ${tripId}`).map((r) => ({
    ...r,
    authorAvatarIcon: parseAvatarIcon(r.authorAvatarIcon),
    votes: tally.get(r.id)?.votes ?? 0,
    mine: tally.get(r.id)?.mine ?? false,
  }));
}
