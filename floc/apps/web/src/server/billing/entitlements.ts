/**
 * The entitlement gate (ticket 246) — the only place the "is this person
 * allowed this feature" question is answered. `canUseFeature` returns a
 * boolean, for deciding whether to draw a lock; `assertFeature` throws on the
 * write path, exactly as `assertAdmin` does in ./access.ts.
 *
 * Deliberately not folded into `requireTripAccess`, which already loads the
 * member list and could answer this for free: that welds billing into the
 * layer every page depends on, and a billing bug would then break page loads
 * rather than one lock. Entitlements get their own `cache()`, so only pages
 * with a Pro surface pay for the query.
 *
 * Pro is personal (ADR-012, #523): the answer is always about one person,
 * never their trip. A Pro member changes nothing for anyone else on it.
 */
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";

import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { subscription } from "@/db/schema";
import { allFeaturesFree } from "@/lib/env";
import { requestMemo } from "@/server/request-scope";
import { FEATURE_PLAN, planMeets } from "@floc/core/billing/plans";
import type { FeatureKey, Plan } from "@floc/core/billing/plans";

/**
 * Stripe keeps a cancelled subscription `active` until the period ends, so
 * "cancelled but paid up" needs no status of its own — it is `active` with a
 * future period end.
 */
const LIVE_STATUSES = ["active", "trialing"] as const;

/**
 * Why: a row that is live *now*. The period-end check is belt and braces: the
 * webhook should have moved a lapsed row to `canceled`, but a webhook that
 * never arrived must not leave someone Pro forever. A null end means no end —
 * a comp, which never lapses.
 *
 * Nothing here reads `source`: a comped tester and a paying customer run
 * identical code, which is the only reason comping is safe to rely on.
 */
const live = () =>
  and(
    isNull(subscription.deletedAt),
    inArray(subscription.status, LIVE_STATUSES),
    or(
      isNull(subscription.currentPeriodEnd),
      gt(subscription.currentPeriodEnd, new Date()),
    ),
  );

/** The strongest plan in a set of live rows; free when there are none. */
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

/** May this person use this feature — the viewer, never their trip. */
export async function canUseFeature(
  feature: FeatureKey,
  userId: string,
): Promise<boolean> {
  // The kill switch is read here, above the query, so a build with Pro turned
  // off never asks the database who is paying.
  if (allFeaturesFree()) return true;

  return planMeets(await planOfUser(userId), FEATURE_PLAN[feature]);
}

/** The same question for several people in one read: which of them may use the feature. */
export async function whoCanUse(feature: FeatureKey, userIds: string[]): Promise<Set<string>> {
  if (allFeaturesFree()) return new Set(userIds);
  if (userIds.length === 0) return new Set();

  const rows = await db
    .select({ userId: subscription.userId, plan: subscription.plan })
    .from(subscription)
    .where(and(inArray(subscription.userId, userIds), live()))
    .all();

  const needed = FEATURE_PLAN[feature];
  return new Set(rows.filter((row) => planMeets(row.plan, needed)).map((row) => row.userId));
}

/** The write-path form. Same question, refusal instead of a boolean. */
export async function assertFeature(
  feature: FeatureKey,
  userId: string,
): Promise<void> {
  if (!(await canUseFeature(feature, userId))) {
    throw new Refusal("That's a Floc Pro feature.", "forbidden");
  }
}
