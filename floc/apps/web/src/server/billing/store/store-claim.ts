import "server-only";

import type { StoreClaim, StoreClaimResult } from "@floc/api/port";
import { intervalOfProduct } from "@floc/core/billing/store-products";

import { accountTokenFor } from "./account-token";
import { verifyAppStoreTransaction } from "./app-store";
import { readPlaySubscription } from "./play";
import type { StoreFacts } from "./store-facts";
import { recordStoreSubscription, type StoreSource } from "./store-record";

type Verified = { source: StoreSource; facts: StoreFacts; replaces: string | null };

async function verify(claim: StoreClaim): Promise<Verified | "refused" | "unavailable"> {
  if (claim.platform === "ios") {
    const facts = await verifyAppStoreTransaction(claim.token);
    return typeof facts === "string" ? facts : { source: "app_store", facts, replaces: null };
  }
  const read = await readPlaySubscription(claim.token);
  return typeof read === "string" ? read : { source: "play", ...read };
}

/** The phone's word is a question to the store, never an answer. */
export async function claimStorePurchase(
  userId: string,
  claim: StoreClaim,
): Promise<StoreClaimResult> {
  if (!intervalOfProduct(claim.productId)) return "refused";

  const verified = await verify(claim);
  if (typeof verified === "string") return verified;

  const { facts } = verified;
  if (facts.productId !== claim.productId) return "refused";
  // Why: a receipt names the account it was bought for; one lifted from another phone must not move.
  if (facts.accountToken && facts.accountToken !== accountTokenFor(userId)) return "refused";

  const written = await recordStoreSubscription({ userId, ...verified });
  return written === "taken" ? "refused" : "recorded";
}
