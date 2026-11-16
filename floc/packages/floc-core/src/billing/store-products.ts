import type { BillingInterval } from "./plans";

export const STORE_PRODUCT_IDS: Record<BillingInterval, string> = {
  monthly: "floc_pro_monthly",
  yearly: "floc_pro_yearly",
};

export function intervalOfProduct(productId: string): BillingInterval | null {
  const found = (Object.entries(STORE_PRODUCT_IDS) as [BillingInterval, string][]).find(
    ([, id]) => id === productId,
  );
  return found ? found[0] : null;
}
