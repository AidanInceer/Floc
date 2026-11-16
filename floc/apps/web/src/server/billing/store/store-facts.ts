import type { SubscriptionStatus } from "@/db/schema";

export type StoreFacts = {
  storeTransactionId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  accountToken: string | null;
  test: boolean;
};

type AppleTransaction = {
  originalTransactionId?: string;
  productId?: string;
  expiresDate?: number;
  revocationDate?: number;
  appAccountToken?: string;
  environment?: string;
};

const APPLE_STATUS: Record<number, SubscriptionStatus> = {
  1: "active",
  2: "canceled",
  3: "past_due",
  4: "active",
  5: "canceled",
};

export function appleFacts(
  tx: AppleTransaction,
  renewal: { autoRenewStatus?: number } | null = null,
  status: number | null = null,
): StoreFacts | null {
  if (!tx.originalTransactionId || !tx.productId || !tx.expiresDate) return null;

  const read = status === null ? "active" : (APPLE_STATUS[status] ?? "incomplete");
  return {
    storeTransactionId: tx.originalTransactionId,
    productId: tx.productId,
    status: tx.revocationDate ? "canceled" : read,
    currentPeriodEnd: new Date(tx.expiresDate),
    cancelAtPeriodEnd: renewal?.autoRenewStatus === 0,
    accountToken: tx.appAccountToken ?? null,
    test: tx.environment !== "Production",
  };
}

export type PlaySubscription = {
  subscriptionState?: string;
  linkedPurchaseToken?: string;
  lineItems?: {
    productId?: string;
    expiryTime?: string;
    autoRenewingPlan?: { autoRenewEnabled?: boolean };
  }[];
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
  testPurchase?: object;
};

const PLAY_STATE: Record<string, SubscriptionStatus> = {
  SUBSCRIPTION_STATE_ACTIVE: "active",
  SUBSCRIPTION_STATE_CANCELED: "active",
  SUBSCRIPTION_STATE_IN_GRACE_PERIOD: "active",
  SUBSCRIPTION_STATE_ON_HOLD: "past_due",
  SUBSCRIPTION_STATE_PAUSED: "paused",
  SUBSCRIPTION_STATE_PENDING: "incomplete",
  SUBSCRIPTION_STATE_EXPIRED: "canceled",
  SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED: "canceled",
};

export function playFacts(token: string, sub: PlaySubscription): StoreFacts | null {
  const item = sub.lineItems?.[0];
  if (!item?.productId || !item.expiryTime) return null;

  const state = sub.subscriptionState ?? "";
  return {
    storeTransactionId: token,
    productId: item.productId,
    status: PLAY_STATE[state] ?? "incomplete",
    currentPeriodEnd: new Date(item.expiryTime),
    cancelAtPeriodEnd:
      state === "SUBSCRIPTION_STATE_CANCELED" || item.autoRenewingPlan?.autoRenewEnabled === false,
    accountToken: sub.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
    test: sub.testPurchase !== undefined,
  };
}
