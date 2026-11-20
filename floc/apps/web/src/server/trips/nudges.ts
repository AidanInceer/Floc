import "server-only";

import { and, count, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db";
import { nudge } from "@/db/schema";
import { markedUserIds } from "@floc/core/dates/availability";
import { today } from "@floc/core/dates/dates";
import { datesMoment } from "@floc/core/dates/dates-moment";
import {
  NUDGE_TASKS,
  NUDGE_WINDOW_MS,
  nudgeHref,
  nudgePlan,
  nudgeTargets,
  type NudgeTargets,
  type NudgeTask,
} from "@floc/core/trip/nudge/nudge";
import type { TripAccess } from "@/server/access";
import { ideaVoters } from "@/server/ideas/ideas-read";
import { listAvailability } from "@/server/itinerary/availability";
import { assertRoom, LIMITS } from "@/server/limits";
import { settleUpFor } from "@/server/money/settle-up";
import { recordActivity, type Tx } from "@/server/notifications/activity";
import { refresh } from "@/server/freshness";

type NudgeAccess = Pick<TripAccess, "trip" | "viewer" | "members">;

export type KnownForNudges = { markedUserIds?: string[]; owedBy?: string[] };

const since = () => new Date(Date.now() - NUDGE_WINDOW_MS);

async function recentNudges(tripId: number): Promise<{ task: string; toUserId: string }[]> {
  return db
    .select({ task: nudge.tab, toUserId: nudge.toUserId })
    .from(nudge)
    .where(and(eq(nudge.tripId, tripId), gt(nudge.createdAt, since()), isNull(nudge.deletedAt)))
    .limit(LIMITS.nudgesPerDay * LIMITS.members)
    .all();
}

async function sentToday(tripId: number, fromUserId: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(nudge)
    .where(and(eq(nudge.tripId, tripId), eq(nudge.fromUserId, fromUserId), gt(nudge.createdAt, since())));
  return n;
}

async function owedBy(tripId: number, viewerId: string): Promise<string[]> {
  const settle = await settleUpFor(tripId, viewerId);
  return settle.rows.filter((r) => r.payee === viewerId).map((r) => r.payer);
}

export async function nudgeTargetsFor(
  access: NudgeAccess,
  tasks: readonly NudgeTask[] = NUDGE_TASKS,
  known: KnownForNudges = {},
): Promise<NudgeTargets> {
  const tripId = access.trip.id;
  const want = (task: NudgeTask) => tasks.includes(task);
  const [recent, marked, ideas, owing] = await Promise.all([
    recentNudges(tripId),
    want("dates") ? (known.markedUserIds ?? listAvailability(tripId).then(markedUserIds)) : undefined,
    want("ideas") ? ideaVoters(tripId) : undefined,
    want("money") ? (known.owedBy ?? owedBy(tripId, access.viewer.id)) : undefined,
  ]);
  return nudgeTargets({
    viewerId: access.viewer.id,
    moment: datesMoment(access.trip, today()),
    members: access.members.map((m) => ({ userId: m.userId, name: m.name })),
    recent,
    markedUserIds: marked,
    ideas,
    owedBy: owing,
  });
}

async function writeNudge(tx: Tx, args: { tripId: number; fromUserId: string; toUserId: string; tab: NudgeTask }): Promise<void> {
  const row = await tx.insert(nudge).values(args).returning({ id: nudge.id }).get();
  await recordActivity(tx, {
    kind: "nudge_sent",
    tripId: args.tripId,
    actorId: args.fromUserId,
    subjectId: row.id,
    href: nudgeHref(args.tripId, args.tab),
    affected: [args.toUserId],
    detail: args.tab,
  });
}

export async function insertNudge(args: { tripId: number; fromUserId: string; toUserId: string; tab: NudgeTask }): Promise<void> {
  assertRoom("nudgesPerDay", await sentToday(args.tripId, args.fromUserId));
  await db.transaction((tx) => writeNudge(tx, args));
}

export async function sendNudges(
  access: NudgeAccess,
  task: NudgeTask,
  toUserIds: string[],
): Promise<{ send: string[]; capped: boolean }> {
  const tripId = access.trip.id;
  const fromUserId = access.viewer.id;
  const [targets, sent] = await Promise.all([nudgeTargetsFor(access, [task]), sentToday(tripId, fromUserId)]);
  const plan = nudgePlan(targets[task], toUserIds, sent, LIMITS.nudgesPerDay);
  if (plan.send.length > 0) {
    await db.transaction(async (tx) => {
      for (const toUserId of plan.send) await writeNudge(tx, { tripId, fromUserId, toUserId, tab: task });
    });
  }
  return plan;
}

export function refreshNudged(tripId: number): void {
  for (const kind of ["tripOverview", "tripDates", "money"] as const) refresh({ kind, tripId });
}
