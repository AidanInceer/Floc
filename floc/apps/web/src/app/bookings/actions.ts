"use server";

import { rejectUpload } from "@floc/core/documents/documents";

import { requireUser } from "@/server/access";
import { placeWaitingBooking, removeWaitingBooking, saveWaitingBooking } from "@/server/documents/bookings/booking-inbox";

type Answer = { error?: string } | void;

/** Why the viewer is read here and never taken from the form: a waiting file is only ever its member's (#559). */
export async function placeBooking(fileId: number, formData: FormData): Promise<Answer> {
  const viewer = await requireUser("/bookings");
  const tripId = Number(formData.get("tripId"));
  if (!Number.isInteger(tripId) || tripId <= 0) return { error: "Choose a trip." };
  const refusal = await placeWaitingBooking(viewer.id, fileId, tripId);
  if (refusal) return { error: refusal };
}

export async function removeBooking(fileId: number): Promise<void> {
  const viewer = await requireUser("/bookings");
  await removeWaitingBooking(viewer.id, fileId);
}

export async function uploadBooking(formData: FormData): Promise<Answer> {
  const viewer = await requireUser("/bookings");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pick a file first" };
  const invalid = rejectUpload(file.type, file.size);
  if (invalid) return { error: invalid };
  const refusal = await saveWaitingBooking(viewer.id, {
    name: file.name,
    mimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
  if (refusal) return { error: refusal };
}
