import "server-only";

import { and, eq, gte, inArray, isNull, or } from "drizzle-orm";

import { activity, notification } from "@/db/schema";
import {
  PLAN_CHANGE_KINDS,
  isPlanChange,
  orderPlanChanges,
  readPlanChange,
  spotWords,
  type PlanChange,
  type PlanChangeKind,
} from "@floc/core/notifications/plan-change";
import { notificationRows, stillVisible } from "@/server/notifications/visible";

const JUST_READ_MS = 30 * 60_000;
const MOST_STEPS = 100;

export type PlanNote = {
  id: number;
  kind: PlanChangeKind;
  actor: string;
  at: Date;
  change: PlanChange;
  words: { was: string | null; now: string | null };
  index: number;
  total: number;
  prevId: number | null;
  nextId: number | null;
};

export async function readPlanNote(userId: string, tripId: number, notificationId: number): Promise<PlanNote | null> {
  const rows = await notificationRows(
    and(
      eq(notification.userId, userId),
      stillVisible(),
      eq(activity.tripId, tripId),
      inArray(activity.kind, PLAN_CHANGE_KINDS),
      or(
        isNull(notification.readAt),
        gte(notification.readAt, new Date(Date.now() - JUST_READ_MS)),
        eq(notification.id, notificationId),
      ),
    ),
    MOST_STEPS,
  );
  const steps = orderPlanChanges(
    rows.flatMap((row) => {
      const change = readPlanChange(row.detail);
      return change && isPlanChange(row.kind) ? [{ id: row.id, kind: row.kind, change, row }] : [];
    }),
  );
  const index = steps.findIndex((step) => step.id === notificationId);
  if (index < 0) return null;
  const { id, kind, change, row } = steps[index];
  return {
    id,
    kind,
    actor: row.actorDisplayName ?? row.actorName,
    at: row.at,
    change,
    words: spotWords(kind, change),
    index,
    total: steps.length,
    prevId: steps[index - 1]?.id ?? null,
    nextId: steps[index + 1]?.id ?? null,
  };
}
