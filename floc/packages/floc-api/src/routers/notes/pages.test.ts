import { expect, it, vi } from "vitest";

import { pagesRouter } from "./pages";
import type { FlocPort } from "../../port";

function callerWith(port: Partial<FlocPort>) {
  return pagesRouter.createCaller({
    viewer: { id: "u1", name: "Ada", email: "ada@example.com", image: null },
    port: { loadTrip: async (_viewer: string, tripId: number) => (tripId === 1 ? { id: 1 } : null), ...port } as unknown as FlocPort,
  });
}

it("passes the viewer down for every page change", async () => {
  const port = {
    listPages: vi.fn().mockResolvedValue({ pages: [], archived: [] }),
    createPage: vi.fn().mockResolvedValue({ id: 5 }),
    renamePage: vi.fn().mockResolvedValue(null),
    setPageIcon: vi.fn().mockResolvedValue(undefined),
    movePage: vi.fn().mockResolvedValue(null),
    archivePage: vi.fn().mockResolvedValue(null),
    restorePage: vi.fn().mockResolvedValue(null),
    listTripLinks: vi.fn().mockResolvedValue([]),
    listPageComments: vi.fn().mockResolvedValue([]),
    addPageComment: vi.fn().mockResolvedValue({ id: 9 }),
    resolvePageComment: vi.fn().mockResolvedValue(undefined),
  };
  const caller = callerWith(port);
  await caller.list({ tripId: 1 });
  await expect(caller.create({ tripId: 1, parentId: null })).resolves.toEqual({ id: 5 });
  await caller.rename({ tripId: 1, pageId: 5, title: " Where to eat " });
  await caller.setIcon({ tripId: 1, pageId: 5, icon: "food" });
  await caller.move({ tripId: 1, pageId: 5, beforeId: null });
  await caller.archive({ tripId: 1, pageId: 5 });
  await caller.restore({ tripId: 1, pageId: 5 });
  await caller.links({ tripId: 1 });
  await caller.comments({ tripId: 1, pageId: 5 });
  await expect(caller.comment({ tripId: 1, pageId: 5, replyTo: null, body: " Hire a car? " })).resolves.toEqual({ id: 9 });
  await caller.resolve({ tripId: 1, commentId: 9 });

  expect(port.renamePage).toHaveBeenCalledWith("u1", 1, 5, "Where to eat");
  expect(port.setPageIcon).toHaveBeenCalledWith("u1", 1, 5, "food");
  expect(port.addPageComment).toHaveBeenCalledWith("u1", 1, 5, null, "Hire a car?");
  expect(port.resolvePageComment).toHaveBeenCalledWith("u1", 1, 9);
});

it("refuses an icon it does not know, and an empty comment, before the port sees them", async () => {
  const setPageIcon = vi.fn();
  const addPageComment = vi.fn();
  const caller = callerWith({ setPageIcon, addPageComment });
  await expect(caller.setIcon({ tripId: 1, pageId: 5, icon: "rocket" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(caller.comment({ tripId: 1, pageId: 5, replyTo: null, body: "  " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(setPageIcon).not.toHaveBeenCalled();
  expect(addPageComment).not.toHaveBeenCalled();
});

it("answers a trip the viewer is not in as not found (rule 5)", async () => {
  const listPages = vi.fn();
  await expect(callerWith({ listPages }).list({ tripId: 2 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(listPages).not.toHaveBeenCalled();
});
