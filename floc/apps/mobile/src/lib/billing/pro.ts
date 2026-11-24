import type { BillingStatus, StoreClaim } from "@floc/api/port";
import { billingHome } from "@floc/core/billing/billing-home";
import type { BillingInterval } from "@floc/core/billing/plans";
import { STORE_PRODUCT_IDS, intervalOfProduct } from "@floc/core/billing/store-products";
import { isLive, periodSaving, renewalLabel } from "@floc/core/billing/subscription-copy";

export type ProView =
  | { kind: "hidden" }
  | { kind: "free"; line: string | null }
  | { kind: "pro"; line: string; manage: "app_store" | "play" | "elsewhere" | "none" };

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

type StoreProduct = { id: string; displayPrice: string; price?: number | null };

const OFFERS: { interval: BillingInterval; per: string; months: number }[] = [
  { interval: "yearly", per: "a year", months: 12 },
  { interval: "quarterly", per: "every 3 months", months: 3 },
  { interval: "monthly", per: "a month", months: 1 },
];

function savingOf(monthly: StoreProduct | undefined, product: StoreProduct, months: number): number | null {
  if (!monthly?.price || !product.price) return null;
  return periodSaving(Math.round(monthly.price * 100), Math.round(product.price * 100), months);
}

export function storeOffers<P extends StoreProduct>(products: readonly P[]): { product: P; label: string; lead: boolean }[] {
  const monthly = products.find((p) => p.id === STORE_PRODUCT_IDS.monthly);
  const offers = OFFERS.flatMap(({ interval, per, months }) => {
    const product = products.find((p) => p.id === STORE_PRODUCT_IDS[interval]);
    if (!product?.displayPrice) return [];
    const saving = savingOf(monthly, product, months) ?? 0;
    return [{ product, saving, label: `${product.displayPrice} ${per}${saving ? ` · save ${saving}%` : ""}` }];
  });
  const most = Math.max(0, ...offers.map((offer) => offer.saving));
  const leadAt = most > 0 ? offers.findIndex((offer) => offer.saving === most) : 0;
  return offers.map(({ product, label }, i) => ({ product, label, lead: i === leadAt }));
}
