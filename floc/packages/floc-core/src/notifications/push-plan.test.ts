import { describe, expect, it } from "vitest";

import { PUSH_DAY_CAP, PUSH_TRIP_GAP_MS, planPushes, type PendingPush } from "./push-plan";

const now = new Date("2026-09-13T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);

const pending = (over: Partial<PendingPush> = {}): PendingPush => ({
  notificationId: 1,
  userId: "sam",
  tripId: 7,
  tripName: "Rome",
  text: "Ada nudged you about Rome",
  href: "/trip/7/money",
  ...over,
});

describe("planPushes", () => {
  it("sends one notification as its own line, titled with the trip", () => {
    expect(planPushes([pending()], [], now)).toEqual([
      {
        userId: "sam",
        tripId: 7,
        title: "Rome",
        body: "Ada nudged you about Rome",
        href: "/trip/7/money",
        notificationIds: [1],
      },
    ]);
  });

  it("folds everything for one person and trip into one message", () => {
    const [push] = planPushes(
      [pending(), pending({ notificationId: 2, href: "/trip/7/dates" }), pending({ notificationId: 3 })],
      [],
      now,
    );
    expect(push).toMatchObject({ body: "3 new things", href: "/inbox", notificationIds: [1, 2, 3] });
  });

  it("keeps the shared href when every item points at the same place", () => {
    const [push] = planPushes([pending(), pending({ notificationId: 2 })], [], now);
    expect(push.href).toBe("/trip/7/money");
  });

  it("sends each trip, and each person, apart", () => {
    const plan = planPushes(
      [pending(), pending({ notificationId: 2, tripId: 8 }), pending({ notificationId: 3, userId: "ada" })],
      [],
      now,
    );
    expect(plan).toHaveLength(3);
  });

  it("titles a push with no trip as Floc", () => {
    const [push] = planPushes([pending({ tripId: null, tripName: null })], [], now);
    expect(push.title).toBe("Floc");
  });

  it("holds a trip that had a push in the last 15 minutes", () => {
    const sent = [{ userId: "sam", tripId: 7, sentAt: ago(PUSH_TRIP_GAP_MS - 1) }];
    expect(planPushes([pending()], sent, now)).toEqual([]);
    expect(planPushes([pending()], [{ ...sent[0], sentAt: ago(PUSH_TRIP_GAP_MS) }], now)).toHaveLength(1);
  });

  it("holds the rest of the day once a person has had six", () => {
    const sent = Array.from({ length: PUSH_DAY_CAP - 1 }, (_, i) => ({
      userId: "sam",
      tripId: 100 + i,
      sentAt: ago(3_600_000),
    }));
    const plan = planPushes([pending(), pending({ notificationId: 2, tripId: 8 })], sent, now);
    expect(plan.map((p) => p.tripId)).toEqual([7]);
  });

  it("forgets a push older than a day", () => {
    const sent = Array.from({ length: PUSH_DAY_CAP }, (_, i) => ({
      userId: "sam",
      tripId: 100 + i,
      sentAt: ago(86_400_000),
    }));
    expect(planPushes([pending()], sent, now)).toHaveLength(1);
  });
});
