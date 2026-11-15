import { describe, expect, it } from "vitest";

import { OverviewGroup } from "@/components/trip/overview/overview-group";
import { EstimateBanner } from "@/components/trip/overview/estimate-banner";
import type { EstimateView } from "@floc/core/money/estimate/view";
import { PanelPlaceholder, StreamedEstimate, StreamedGroup } from "./streamed";

describe("StreamedEstimate", () => {
  it("draws nothing for a member without Pro (#574)", async () => {
    expect(await StreamedEstimate({ tripId: 7, estimate: Promise.resolve(null) })).toBeNull();
  });

  it("draws the member's own banner once their estimate arrives", async () => {
    const view = { currency: "GBP", places: true } as unknown as EstimateView;
    const element = await StreamedEstimate({ tripId: 7, estimate: Promise.resolve(view) });
    expect(element?.type).toBe(EstimateBanner);
    expect(element?.props).toEqual({ tripId: 7, view });
  });
});

describe("StreamedGroup", () => {
  it("draws the group once its streamed extras arrive", async () => {
    const extras = { friendStates: new Map(), pendingInvitees: [], declinedInvitees: [], friends: [] };
    const props = { tripId: 7, viewerId: "u1", members: [], isAdmin: true, inviteUrl: "https://floc.test/invite/tok", needDates: new Set<string>() };
    const element = await StreamedGroup({ ...props, extras: Promise.resolve(extras) } as unknown as Parameters<typeof StreamedGroup>[0]);
    expect(element.type).toBe(OverviewGroup);
    expect(element.props).toMatchObject({ ...props, ...extras });
  });
});

describe("PanelPlaceholder", () => {
  it("holds the group's place while it streams, hidden from readers", () => {
    expect(PanelPlaceholder().props["aria-hidden"]).toBe(true);
  });
});
