import { afterEach, expect, it, vi } from "vitest";

import { capturedLogAsync } from "@/test/captured-log";

const retrieve = vi.hoisted(() => vi.fn());
vi.mock("stripe", () => ({ default: class { prices = { retrieve }; } }));

afterEach(() => vi.unstubAllEnvs());

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
