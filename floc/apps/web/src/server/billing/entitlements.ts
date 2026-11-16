import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { subscription, tripMembership } from "@/db/schema";
import { allFeaturesFree } from "@/lib/env";
import { requestMemo } from "@/server/request-scope";
import { FEATURE_PLAN, planMeets } from "@floc/core/billing/plans";
import type { FeatureKey, Plan, TargetOf } from "@floc/core/billing/plans";

const LIVE_STATUSES = ["active", "trialing"] as const;

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

const tripPlanRow = cache(async function tripPlanRow(
  tripId: number,
): Promise<Plan> {
  const rows = await db
    .select({ plan: subscription.plan })
    .from(subscription)
    .innerJoin(tripMembership, eq(tripMembership.userId, subscription.userId))
    .where(
      and(
        eq(tripMembership.tripId, tripId),
        isNull(tripMembership.deletedAt),
        live(),
      ),
    )
    .all();

  return best(rows);
});

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

const planOfTrip = (tripId: number) => requestMemo(`plan-trip:${tripId}`, () => tripPlanRow(tripId));
const planOfUser = (userId: string) => requestMemo(`plan-user:${userId}`, () => userPlanRow(userId));

export async function canUseFeature<K extends FeatureKey>(
  feature: K,
  target: TargetOf<K>,
): Promise<boolean> {
  if (allFeaturesFree()) return true;

  const { plan, scope } = FEATURE_PLAN[feature];
  const held =
    scope === "trip"
      ? await planOfTrip(target as number)
      : await planOfUser(target as string);

  return planMeets(held, plan);
}

export async function assertFeature<K extends FeatureKey>(
  feature: K,
  target: TargetOf<K>,
): Promise<void> {
  if (!(await canUseFeature(feature, target))) {
    throw new Refusal("That's a Floc Pro feature.", "forbidden");
  }
}
