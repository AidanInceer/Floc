import { afterEach, expect, it, vi } from "vitest";

import { capturedLogAsync } from "@/test/captured-log";

const retrieve = vi.hoisted(() => vi.fn());
vi.mock("stripe", () => ({ default: class { prices = { retrieve }; } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  retrieve.mockReset();
});

function sellingPro() {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit");
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly_unit");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly_unit");
}

it("sells Pro without a price it cannot read, and logs no price id", async () => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit");
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly_unit");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly_unit");
  retrieve.mockImplementation(async (id: string) => {
    if (id === "price_yearly_unit") throw new Error("No such price: price_yearly_unit");
    return { unit_amount: 399, currency: "gbp" };
  });
  const { proPrices } = await import("./billing");
  const { result, lines } = await capturedLogAsync(() => proPrices());
  expect(result).toEqual([{ interval: "monthly", amountMinor: 399, currency: "GBP" }]);
  expect(lines).toEqual([expect.objectContaining({ level: "warn", message: "billing.price-unreadable" })]);
  expect(JSON.stringify(lines)).not.toContain("price_yearly_unit");
});

it("sells the 3-month price from its own variable (#523)", async () => {
  sellingPro();
  vi.stubEnv("STRIPE_PRICE_QUARTERLY", "price_quarterly_unit");
  retrieve.mockImplementation(async (id: string) => ({ unit_amount: id === "price_quarterly_unit" ? 899 : 399, currency: "gbp" }));
  const { priceFor, proPrices } = await import("./billing");
  expect(priceFor("quarterly")).toBe("price_quarterly_unit");
  expect(await proPrices()).toContainEqual({ interval: "quarterly", amountMinor: 899, currency: "GBP" });
});

it("reads the prices from Stripe once, not on every page view", async () => {
  sellingPro();
  retrieve.mockResolvedValue({ unit_amount: 399, currency: "gbp" });
  const { proPrices } = await import("./billing");
  await proPrices();
  await proPrices();
  expect(retrieve).toHaveBeenCalledTimes(2);
});

it("asks Stripe again after a price could not be read", async () => {
  sellingPro();
  retrieve.mockRejectedValueOnce(new Error("down")).mockResolvedValue({ unit_amount: 399, currency: "gbp" });
  const { proPrices } = await import("./billing");
  await capturedLogAsync(() => proPrices());
  const again = await proPrices();
  expect(again).toHaveLength(2);
});
