import "server-only";

import type { FlocPort } from "@floc/api/port";

import { billingStatusOf } from "@/server/billing/billing-status";
import { claimStorePurchase } from "@/server/billing/store/store-claim";

type BillingPort = Pick<FlocPort, "loadBillingStatus" | "claimStorePurchase">;

export const billingPort: BillingPort = {
  loadBillingStatus: (viewerId) => billingStatusOf(viewerId),
  claimStorePurchase: (viewerId, claim) => claimStorePurchase(viewerId, claim),
};
