import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { and, eq, gt, inArray, isNull, notInArray, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { subscription } from "@/db/schema";
import { allFeaturesFree } from "@/lib/env";
import { requestMemo } from "@/server/request-scope";
import { FEATURE_PLAN, planMeets } from "@floc/core/billing/plans";
import type { FeatureKey, Plan } from "@floc/core/billing/plans";
import { isLive } from "@floc/core/billing/subscription-copy";

const LIVE_STATUSES = ["active", "trialing"] as const;
const NEVER_PAID = ["incomplete", "incomplete_expired"] as const;

export type ProStanding = "pro" | "ended";

const live = () =>
  and(
    isNull(subscription.deletedAt),
    inArray(subscription.status, LIVE_STATUSES),
    or(
      isNull(subscription.currentPeriodEnd),
      gt(subscription.currentPeriodEnd, new Date()),
    ),
  );

function best(rows: { plan: Plan }[]): Plan {
  return rows.reduce<Plan>(
    (held, row) => (planMeets(row.plan, held) ? row.plan : held),
    "free",
  );
}

const userPlanRow = cache(async function userPlanRow(
  userId: string,
): Promise<Plan> {
  const rows = await db
    .select({ plan: subscription.plan })
    .from(subscription)
    .where(and(eq(subscription.userId, userId), live()))
    .all();

  return best(rows);
});

const planOfUser = (userId: string) => requestMemo(`plan-user:${userId}`, () => userPlanRow(userId));

export async function canUseFeature(feature: FeatureKey, userId: string): Promise<boolean> {
  if (allFeaturesFree()) return true;
  return planMeets(await planOfUser(userId), FEATURE_PLAN[feature].plan);
}

export async function assertFeature(feature: FeatureKey, userId: string): Promise<void> {
  if (!(await canUseFeature(feature, userId))) {
    throw new Refusal("That's a Floc Pro feature.", "forbidden");
  }
}

export async function proStanding(userIds: readonly string[]): Promise<Map<string, ProStanding>> {
  const ids = [...new Set(userIds)];
  if (allFeaturesFree()) return new Map(ids.map((id) => [id, "pro"]));
  if (ids.length === 0) return new Map();

  const rows = await db
    .select({
      userId: subscription.userId,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    })
    .from(subscription)
    .where(and(inArray(subscription.userId, ids), isNull(subscription.deletedAt), notInArray(subscription.status, [...NEVER_PAID])))
    .all();

  const standing = new Map<string, ProStanding>();
  for (const row of rows) {
    if (isLive(row)) standing.set(row.userId, "pro");
    else if (!standing.has(row.userId)) standing.set(row.userId, "ended");
  }
  return standing;
}
