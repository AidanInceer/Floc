import { expect, it, vi } from "vitest";

import { bookingsRouter } from "./bookings";
import type { FlocPort } from "../port";

const viewer = { id: "u1", name: "Ada", email: "ada@example.com", image: null };
const caller = (port: Partial<FlocPort>, signedIn = true) =>
  bookingsRouter.createCaller({ viewer: signedIn ? viewer : null, port: port as FlocPort });

it("reads only the viewer's own Bookings area and count", async () => {
  const bookingsArea = vi.fn().mockResolvedValue({ files: [], trips: [], usage: { usedBytes: 0, quotaBytes: 1 }, address: null, canUpload: true });
  const waitingBookingCount = vi.fn().mockResolvedValue(2);
  const api = caller({ bookingsArea, waitingBookingCount });
  await expect(api.area()).resolves.toMatchObject({ files: [] });
  await expect(api.waitingCount()).resolves.toBe(2);
  expect(bookingsArea).toHaveBeenCalledWith("u1");
  expect(waitingBookingCount).toHaveBeenCalledWith("u1");
});

it("uploads, places and removes as the viewer", async () => {
  const uploadWaitingBooking = vi.fn().mockResolvedValue(null);
  const placeWaitingBooking = vi.fn().mockResolvedValue("Choose one of your trips.");
  const removeWaitingBooking = vi.fn().mockResolvedValue(undefined);
  const api = caller({ uploadWaitingBooking, placeWaitingBooking, removeWaitingBooking });

  const file = { name: "Hotel.pdf", mimeType: "application/pdf", contentBase64: "JVBERg==" };
  await expect(api.upload(file)).resolves.toBeNull();
  expect(uploadWaitingBooking).toHaveBeenCalledWith("u1", file);
  await expect(api.place({ fileId: 4, tripId: 9 })).resolves.toBe("Choose one of your trips.");
  expect(placeWaitingBooking).toHaveBeenCalledWith("u1", 4, 9);
  await api.remove({ fileId: 4 });
  expect(removeWaitingBooking).toHaveBeenCalledWith("u1", 4);
});

it("rejects oversized base64 and a bad id before the port is asked", async () => {
  const uploadWaitingBooking = vi.fn();
  const placeWaitingBooking = vi.fn();
  const api = caller({ uploadWaitingBooking, placeWaitingBooking });
  await expect(
    api.upload({ name: "big.pdf", mimeType: "application/pdf", contentBase64: "A".repeat(Math.ceil((8 * 1024 * 1024) / 3) * 4 + 1) }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(api.place({ fileId: 0, tripId: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(uploadWaitingBooking).not.toHaveBeenCalled();
  expect(placeWaitingBooking).not.toHaveBeenCalled();
});

it("refuses a caller who is not signed in", async () => {
  const bookingsArea = vi.fn();
  await expect(caller({ bookingsArea }, false).area()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(bookingsArea).not.toHaveBeenCalled();
});
