import { describe, expect, it } from "vitest";

import { OverviewGroup } from "@/components/trip/overview/overview-group";
import { PanelPlaceholder, StreamedGroup } from "./streamed";

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
