import { expect, it, vi } from "vitest";

import { filesRouter } from "./files";
import type { FlocPort } from "../port";

it("accepts base64 at the 8 MB file boundary", async () => {
  const uploadFile = vi.fn().mockResolvedValue(null);
  const caller = filesRouter.createCaller({
    viewer: { id: "u1", name: "Ada", email: "ada@example.com", image: null },
    port: { loadTrip: async () => ({ id: 1 }), uploadFile } as unknown as FlocPort,
  });
  await expect(caller.upload({
    tripId: 1, name: "file.png", mimeType: "image/png", category: "other", shared: false,
    contentBase64: "A".repeat(Math.ceil(8 * 1024 * 1024 / 3) * 4),
  })).resolves.toBeNull();
  expect(uploadFile).toHaveBeenCalledOnce();
});

it("rejects oversized base64 before passing it to the file port", async () => {
  const uploadFile = vi.fn();
  const caller = filesRouter.createCaller({
    viewer: { id: "u1", name: "Ada", email: "ada@example.com", image: null },
    port: { loadTrip: async () => ({ id: 1 }), uploadFile } as unknown as FlocPort,
  });

  await expect(caller.upload({
    tripId: 1, name: "file.png", mimeType: "image/png", category: "other", shared: false,
    contentBase64: "A".repeat(Math.ceil(8 * 1024 * 1024 / 3) * 4 + 1),
  })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(uploadFile).not.toHaveBeenCalled();
});

it("asks the port for the shared bookings address (#559)", async () => {
  const fileInboxAddress = vi.fn().mockResolvedValue("bookings@in.floc.test");
  const caller = filesRouter.createCaller({
    viewer: { id: "u1", name: "Ada", email: "ada@example.com", image: null },
    port: { loadTrip: async () => ({ id: 1 }), fileInboxAddress } as unknown as FlocPort,
  });

  await expect(caller.inboxAddress({ tripId: 1 })).resolves.toBe("bookings@in.floc.test");
  expect(fileInboxAddress).toHaveBeenCalledWith("u1", 1);
});

it("renames a file trimmed, and refuses a blank name before the port sees it (#364)", async () => {
  const renameFile = vi.fn().mockResolvedValue(null);
  const caller = filesRouter.createCaller({
    viewer: { id: "u1", name: "Ada", email: "ada@example.com", image: null },
    port: { loadTrip: async () => ({ id: 1 }), renameFile } as unknown as FlocPort,
  });

  await expect(caller.rename({ tripId: 1, fileId: 4, name: " Ferry to Mull " })).resolves.toBeNull();
  expect(renameFile).toHaveBeenCalledWith("u1", 1, 4, "Ferry to Mull");

  await expect(caller.rename({ tripId: 1, fileId: 4, name: "  " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(renameFile).toHaveBeenCalledOnce();
});

it("lists the archive and restores from it as the viewer, and to nobody off the trip (ADR-048)", async () => {
  const listArchivedFiles = vi.fn().mockResolvedValue([]);
  const restoreFile = vi.fn().mockResolvedValue("This trip has used all of its 200 MB. Remove a file to make room.");
  const loadTrip = async (viewerId: string) => (viewerId === "u1" ? { id: 1 } : null);
  const port = { loadTrip, listArchivedFiles, restoreFile } as unknown as FlocPort;
  const member = filesRouter.createCaller({ viewer: { id: "u1", name: "Ada", email: "ada@example.com", image: null }, port });
  const stranger = filesRouter.createCaller({ viewer: { id: "u9", name: "Eve", email: "eve@example.com", image: null }, port });

  await expect(member.archived({ tripId: 1 })).resolves.toEqual([]);
  expect(listArchivedFiles).toHaveBeenCalledWith("u1", 1);
  await expect(member.restore({ tripId: 1, fileId: 4 })).resolves.toMatch(/used all of its 200 MB/);
  expect(restoreFile).toHaveBeenCalledWith("u1", 1, 4);

  await expect(stranger.archived({ tripId: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(stranger.restore({ tripId: 1, fileId: 4 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(restoreFile).toHaveBeenCalledOnce();
});

it("reads the old stay category as hotel, for a phone build from before the rename", async () => {
  const uploadFile = vi.fn().mockResolvedValue(null);
  const caller = filesRouter.createCaller({
    viewer: { id: "u1", name: "Ada", email: "ada@example.com", image: null },
    port: { loadTrip: async () => ({ id: 1 }), uploadFile } as unknown as FlocPort,
  });
  await caller.upload({ tripId: 1, name: "flat.pdf", mimeType: "application/pdf", category: "stay", shared: true, contentBase64: "AAAA" });
  expect(uploadFile).toHaveBeenCalledWith("u1", 1, expect.objectContaining({ category: "hotel" }));
});
