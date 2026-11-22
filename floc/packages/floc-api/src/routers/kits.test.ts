import { expect, it, vi } from "vitest";

import type { FlocPort } from "../port";
import { appRouter } from "../router";

const viewer = { id: "u1", name: "Ana", email: "ana@example.test", image: null };
const loadTrip = vi.fn().mockResolvedValue({ id: 1 });

it("deletes a saved list from a trip through the one delete the lists page uses", async () => {
  const deleteKit = vi.fn().mockResolvedValue(undefined);
  const port = { loadTrip, deleteKit } as unknown as FlocPort;

  await appRouter.createCaller({ viewer, port }).packing.deleteKit({ tripId: 1, kitId: 4 });

  expect(deleteKit).toHaveBeenCalledWith("u1", 4);
});

it("asks for a name in the same words wherever a saved list is named", async () => {
  const port = { loadTrip } as unknown as FlocPort;
  const caller = appRouter.createCaller({ viewer, port });

  await expect(caller.kits.create({ name: " " })).rejects.toThrow("Give the list a name.");
  await expect(caller.packing.saveKit({ tripId: 1, name: " " })).rejects.toThrow("Give the list a name.");
});
