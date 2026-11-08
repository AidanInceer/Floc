/**
 * Floc Pro on the phone: what the block says, and what a store purchase sends.
 * The words come from `@floc/core`, the same ones the web Settings page uses.
 */
import type { BillingStatus, StoreClaim } from "@floc/api/port";
import { billingHome } from "@floc/core/billing/billing-home";
import { intervalOfProduct } from "@floc/core/billing/store-products";
import { isLive, renewalLabel } from "@floc/core/billing/subscription-copy";
import { planOffer, type PlanOffer } from "@floc/core/billing/plan-offer";
import { CURRENCIES, minorPerMajor } from "@floc/core/money/currency";

export type ProView =
  | { kind: "hidden" }
  | { kind: "free"; line: string | null }
  | { kind: "pro"; line: string; manage: "app_store" | "play" | "elsewhere" | "none" };

// Why: the stores refuse an app that links to a web checkout or portal, so a web subscriber gets words, not a link.
const MANAGE = { app_store: "app_store", play: "play", web: "elsewhere", none: "none" } as const;

export function proView(status: BillingStatus, now = new Date()): ProView {
  if (!status.selling) return { kind: "hidden" };

  const sub = status.subscription;
  if (!sub) return { kind: "free", line: null };

  const facts = {
    status: sub.status,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
  };
  if (!isLive(facts, now)) return { kind: "free", line: renewalLabel(facts, now) };

  return { kind: "pro", line: renewalLabel(facts, now), manage: MANAGE[billingHome(sub.source)] };
}

export function claimOf(
  purchase: { productId: string; purchaseToken?: string | null },
  platform: StoreClaim["platform"],
): StoreClaim | null {
  if (!purchase.purchaseToken || !intervalOfProduct(purchase.productId)) return null;
  return { platform, productId: purchase.productId, token: purchase.purchaseToken };
}

export function offerTokenOf(
  product: { subscriptionOffers?: { offerTokenAndroid?: string | null }[] | null } | undefined,
): string | null {
  return product?.subscriptionOffers?.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid ?? null;
}

type StoreProduct = { id: string; displayPrice: string; price?: number | null; currency?: string | null };

/**
 * A store plan's words (#523): the store's own charge, which it localises, then Floc's per-month
 * figure and saving when the currency is one Floc can write exactly; otherwise the charge alone.
 */
export function storeOffer(product: StoreProduct, monthly: StoreProduct | undefined): PlanOffer | null {
  const interval = intervalOfProduct(product.id);
  if (!interval) return null;

  const currency = CURRENCIES.find((c) => c === product.currency?.toUpperCase());
  const minor = (p: StoreProduct | undefined) =>
    currency && p?.price && p.currency?.toUpperCase() === currency ? Math.round(p.price * minorPerMajor(currency)) : null;
  const amountMinor = minor(product);

  const offer = planOffer({ interval, amountMinor: amountMinor ?? 0, currency: currency ?? "GBP" }, minor(monthly));
  return amountMinor === null
    ? { ...offer, charge: product.displayPrice, perMonth: null, saving: null }
    : { ...offer, charge: product.displayPrice };
}