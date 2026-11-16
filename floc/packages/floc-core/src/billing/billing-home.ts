export type BillingHome = "web" | "app_store" | "play" | "none";

export function billingHome(source: string): BillingHome {
  if (source === "app_store" || source === "play") return source;
  if (source === "stripe") return "web";
  return "none";
}
