import { expect, it, vi } from "vitest";

import type { FlocPort } from "../../port";
import { appRouter } from "../../router";

const viewer = { id: "u1", name: "Ana", email: "ana@example.test", image: null };
const trip = { id: 4, members: [] };

it("reads who the viewer can nudge on a trip they can see (#705)", async () => {
  const targets = { dates: [], money: [], ideas: [] };
  const port = { loadTrip: vi.fn().mockResolvedValue(trip), nudgeTargets: vi.fn().mockResolvedValue(targets) } as unknown as FlocPort;
  await expect(appRouter.createCaller({ viewer, port }).nudges.targets({ tripId: 4 })).resolves.toEqual(targets);
  expect(port.nudgeTargets).toHaveBeenCalledWith("u1", 4);
});

it("sends one batch of nudges for a known task, in one call", async () => {
  const sendNudges = vi.fn().mockResolvedValue({ sent: 2, capped: false });
  const port = { loadTrip: vi.fn().mockResolvedValue(trip), sendNudges } as unknown as FlocPort;
  const caller = appRouter.createCaller({ viewer, port });
  await expect(caller.nudges.send({ tripId: 4, task: "notes" as never, userIds: ["u2"] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(caller.nudges.send({ tripId: 4, task: "dates", userIds: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(sendNudges).not.toHaveBeenCalled();
  await expect(caller.nudges.send({ tripId: 4, task: "dates", userIds: ["u2", "u3"] })).resolves.toEqual({ sent: 2, capped: false });
  expect(sendNudges).toHaveBeenCalledWith("u1", 4, "dates", ["u2", "u3"]);
});

it("hides a trip the viewer cannot see (rule 5)", async () => {
  const sendNudges = vi.fn();
  const port = { loadTrip: vi.fn().mockResolvedValue(null), sendNudges } as unknown as FlocPort;
  await expect(appRouter.createCaller({ viewer, port }).nudges.send({ tripId: 4, task: "dates", userIds: ["u2"] })).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(sendNudges).not.toHaveBeenCalled();
});
