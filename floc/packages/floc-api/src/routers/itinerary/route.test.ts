import { MAX_BATCH } from "@floc/core/trip/route/route-track";
import { expect, it, vi } from "vitest";

import { routeRouter } from "./route";
import type { FlocPort } from "../../port";

const viewer = { id: "u1", name: "Ada", email: "ada@example.com", image: null };
const position = { lat: 41.9, lng: 12.5, date: "2026-09-03", recordedAt: 1_788_000_000_000 };

function caller(port: Partial<FlocPort>) {
  return routeRouter.createCaller({ viewer, port: { loadTrip: async () => ({ id: 1 }), ...port } as unknown as FlocPort });
}

it("hands a batch of positions to the port for the viewer (#329)", async () => {
  const recordPositions = vi.fn().mockResolvedValue(1);
  await expect(caller({ recordPositions }).record({ tripId: 1, positions: [position] })).resolves.toBe(1);
  expect(recordPositions).toHaveBeenCalledWith("u1", 1, [position]);
});

it("refuses a position off the globe and a batch past the cap before the port sees it", async () => {
  const recordPositions = vi.fn();
  await expect(caller({ recordPositions }).record({ tripId: 1, positions: [{ ...position, lat: 95 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  const many = Array.from({ length: MAX_BATCH + 1 }, () => position);
  await expect(caller({ recordPositions }).record({ tripId: 1, positions: many })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(recordPositions).not.toHaveBeenCalled();
});

it("reads the group's routes for the caller's own day", async () => {
  const groupRoutes = vi.fn().mockResolvedValue([]);
  await caller({ groupRoutes }).group({ tripId: 1, today: "2026-09-03" });
  expect(groupRoutes).toHaveBeenCalledWith("u1", 1, "2026-09-03");
});

it("switches and deletes only the viewer's own route", async () => {
  const setRouteOn = vi.fn();
  const deleteMyRoute = vi.fn();
  const routeOn = vi.fn().mockResolvedValue(true);
  const c = caller({ setRouteOn, deleteMyRoute, routeOn });
  await c.setOn({ tripId: 1, on: true });
  await c.deleteMine({ tripId: 1 });
  await expect(c.on({ tripId: 1 })).resolves.toBe(true);
  expect(setRouteOn).toHaveBeenCalledWith("u1", 1, true);
  expect(deleteMyRoute).toHaveBeenCalledWith("u1", 1);
});
