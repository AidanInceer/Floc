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
 * A trip is Pro if **any** of its live members holds a live subscription —
 * uncapped, no seat ratio. That policy lives here and nowhere else, so a seat
 * cap later is an edit to this file rather than a refactor.
 */
import "server-only";

import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { subscription, tripMembership } from "@/db/schema";
import { allFeaturesFree } from "@/lib/env";
import { FEATURE_PLAN, planMeets } from "@/lib/plans";
import type { FeatureKey, Plan, TargetOf } from "@/lib/plans";

/**
 * Stripe keeps a cancelled subscription `active` until the period ends, so
 * "cancelled but paid up" needs no status of its own — it is `active` with a
 * future period end.
 */
const LIVE_STATUSES = ["active", "trialing"] as const;

/**
 * A row that is live *now*. The period-end check is belt and braces: the
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

const planOfTrip = cache(async function planOfTrip(
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

const planOfUser = cache(async function planOfUser(
  userId: string,
): Promise<Plan> {
  const rows = await db
    .select({ plan: subscription.plan })
    .from(subscription)
    .where(and(eq(subscription.userId, userId), live()))
    .all();

  return best(rows);
});

/**
 * `target` is a trip id or a user id, decided by the feature's declared
 * scope — so a trip-scoped feature will not compile with a user id, and vice
 * versa.
 */
export async function canUseFeature<K extends FeatureKey>(
  feature: K,
  target: TargetOf<K>,
): Promise<boolean> {
  // The kill switch is read here, above the query, so a build with Pro turned
  // off never asks the database who is paying.
  if (allFeaturesFree()) return true;

  const { plan, scope } = FEATURE_PLAN[feature];
  const held =
    scope === "trip"
      ? await planOfTrip(target as number)
      : await planOfUser(target as string);

  return planMeets(held, plan);
}

/** The write-path form. Same question, refusal instead of a boolean. */
export async function assertFeature<K extends FeatureKey>(
  feature: K,
  target: TargetOf<K>,
): Promise<void> {
  if (!(await canUseFeature(feature, target))) {
    throw new Error("That's a Floc Pro feature");
  }
}
