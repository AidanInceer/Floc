import type Stripe from "stripe";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { capturedLogAsync } from "@/test/captured-log";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { customerFor, customerIdOf, recordSubscription, userIdForCustomer } from "./billing";

const create = vi.hoisted(() => vi.fn());
vi.mock("stripe", () => ({ default: class { customers = { create }; } }));

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit");
  create.mockReset();
  create.mockResolvedValue({ id: "cus_new" });
});
afterEach(() => vi.unstubAllEnvs());

const person = () => ({ id: world.admin, email: "admin@example.test", name: "Admin" });

const stripeSub = (id: string, customer: string) =>
  ({
    id,
    customer,
    status: "active",
    items: { data: [] },
    cancel_at_period_end: false,
    cancel_at: null,
  }) as unknown as Stripe.Subscription;

const grantPro = () =>
  db.insert(schema.subscription).values({ userId: world.admin, status: "active", source: "comp" });

it("reuses a person's Stripe customer at checkout when a granted Pro row came first", async () => {
  await grantPro();
  await recordSubscription({ userId: world.admin, sub: stripeSub("sub_1", "cus_old") });

  expect(await customerFor(person())).toBe("cus_old");
  expect(create).not.toHaveBeenCalled();
});

it("makes one Stripe customer for a person who leaves a checkout and starts again", async () => {
  const first = await customerFor(person());
  const second = await customerFor(person());

  expect([first, second]).toEqual(["cus_new", "cus_new"]);
  expect(create).toHaveBeenCalledTimes(1);
});

it("knows whose Stripe customer it is before any subscription exists", async () => {
  await customerFor(person());

  expect(await userIdForCustomer("cus_new")).toBe(world.admin);
});

it("gives the billing portal the person's customer", async () => {
  await recordSubscription({ userId: world.admin, sub: stripeSub("sub_1", "cus_old") });

  expect(await customerIdOf(world.admin)).toBe("cus_old");
});

it("has no customer for a person whose Pro was granted", async () => {
  await grantPro();

  expect(await customerIdOf(world.admin)).toBeNull();
});

it("takes the same Stripe webhook twice without a second customer", async () => {
  await recordSubscription({ userId: world.admin, sub: stripeSub("sub_1", "cus_old") });
  await recordSubscription({ userId: world.admin, sub: stripeSub("sub_1", "cus_old") });

  expect(await customerIdOf(world.admin)).toBe("cus_old");
});

it("keeps a person's first Stripe customer when a webhook names a second, and logs it without the id", async () => {
  await recordSubscription({ userId: world.admin, sub: stripeSub("sub_1", "cus_old") });
  const { lines } = await capturedLogAsync(() =>
    recordSubscription({ userId: world.admin, sub: stripeSub("sub_2", "cus_other") }),
  );

  expect(await customerIdOf(world.admin)).toBe("cus_old");
  expect(lines).toEqual([expect.objectContaining({ level: "warn", message: "billing.second-customer" })]);
  expect(JSON.stringify(lines)).not.toContain("cus_other");
});
