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
