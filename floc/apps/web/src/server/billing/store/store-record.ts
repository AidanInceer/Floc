import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { subscription } from "@/db/schema";

import type { StoreFacts } from "./store-facts";

export type StoreSource = "app_store" | "play";

export async function ownerOfStoreTransaction(storeTransactionId: string): Promise<string | null> {
  const row = await db
    .select({ userId: subscription.userId })
    .from(subscription)
    .where(eq(subscription.storeTransactionId, storeTransactionId))
    .get();
  return row?.userId ?? null;
}

/**
 * Keyed on the store's own id, so a repeated notification overwrites. The
 * owner is never in the update: one purchase backs one account, first come.
 */
export async function recordStoreSubscription(args: {
  userId: string;
  source: StoreSource;
  facts: StoreFacts;
  replaces?: string | null;
}): Promise<"recorded" | "taken"> {
  const { userId, source, facts } = args;

  const owner = await ownerOfStoreTransaction(facts.storeTransactionId);
  if (owner && owner !== userId) return "taken";

  const now = new Date();
  const set = {
    plan: "pro" as const,
    status: facts.status,
    source,
    storeTransactionId: facts.storeTransactionId,
    storeProductId: facts.productId,
    currentPeriodEnd: facts.currentPeriodEnd,
    cancelAtPeriodEnd: facts.cancelAtPeriodEnd,
    lastModifiedAt: now,
  };

  await db
    .insert(subscription)
    .values({ userId, ...set })
    .onConflictDoUpdate({ target: subscription.storeTransactionId, set });

  if (args.replaces) {
    await db
      .update(subscription)
      .set({ status: "canceled", lastModifiedAt: now })
      .where(and(eq(subscription.storeTransactionId, args.replaces), eq(subscription.userId, userId)));
  }

  return "recorded";
}
