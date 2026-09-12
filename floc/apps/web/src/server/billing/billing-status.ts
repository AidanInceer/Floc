import "server-only";

import type { BillingStatus } from "@floc/api/port";

import { allFeaturesFree } from "@/lib/env";

import { subscriptionOf } from "./billing";
import { accountTokenFor } from "./store/account-token";

export async function billingStatusOf(userId: string): Promise<BillingStatus> {
  const row = await subscriptionOf(userId);
  return {
    selling: !allFeaturesFree(),
    accountToken: accountTokenFor(userId),
    subscription: row
      ? {
          status: row.status,
          source: row.source,
          storeProductId: row.storeProductId,
          currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        }
      : null,
  };
}
