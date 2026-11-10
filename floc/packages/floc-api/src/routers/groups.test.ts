import { expect, it, vi } from "vitest";

import type { FlocPort } from "../port";
import { appRouter } from "../router";

const viewer = { id: "u1", name: "Ana", email: "ana@example.test", image: null };

it("requires a signed-in viewer to read their groups", async () => {
  const loadGroups = vi.fn().mockResolvedValue([]);
  const port = { loadGroups } as unknown as FlocPort;
  await expect(appRouter.createCaller({ viewer: null, port }).groups.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(loadGroups).not.toHaveBeenCalled();
  await expect(appRouter.createCaller({ viewer, port }).groups.list()).resolves.toEqual([]);
  expect(loadGroups).toHaveBeenCalledWith("u1");
});

it("rejects an oversized group before passing it to the host", async () => {
  const createGroup = vi.fn().mockResolvedValue(8);
  const port = { createGroup } as unknown as FlocPort;
  const caller = appRouter.createCaller({ viewer, port });
  await expect(caller.groups.create({ name: "Weekend crew", memberIds: Array.from({ length: 21 }, (_, i) => `u${i}`) }))
    .rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(createGroup).not.toHaveBeenCalled();
  await expect(caller.groups.create({ name: " Weekend crew ", memberIds: ["u2"] })).resolves.toBe(8);
  expect(createGroup).toHaveBeenCalledWith("u1", { name: "Weekend crew", memberIds: ["u2"] });
});

it("passes the final people and the used group to trip creation", async () => {
  const createTrip = vi.fn().mockResolvedValue({ id: 9 });
  const port = { createTrip } as unknown as FlocPort;
  const input = { name: "Weekend", friendIds: ["u2"], groupIds: [8] };
  await expect(appRouter.createCaller({ viewer, port }).trips.create(input)).resolves.toEqual({ id: 9 });
  expect(createTrip).toHaveBeenCalledWith("u1", { ...input, startDate: null, endDate: null });
});
