/**
 * The recap picture through the phone's own share sheet (ADR-045): a PNG in the cache, never a link.
 * Throws when the download fails; the caller says so in words.
 */
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { authHeaders } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

export type Look = "light" | "dark";

export const recapPictureUrl = (tripId: number, look: Look) => `${API_BASE_URL}/trip/${tripId}/recap-card?theme=${look}`;

export async function shareRecapPicture(tripId: number, tripName: string, look: Look): Promise<void> {
  const folder = new Directory(Paths.cache, "recap");
  folder.create({ idempotent: true, intermediates: true });
  const name = `${tripName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "trip"}-floc.png`;
  const landed = new File(folder, name);
  if (landed.exists) landed.delete();

  const file = await File.downloadFileAsync(recapPictureUrl(tripId, look), landed, { headers: await authHeaders() });
  await Sharing.shareAsync(file.uri, { mimeType: "image/png", dialogTitle: tripName });
}
