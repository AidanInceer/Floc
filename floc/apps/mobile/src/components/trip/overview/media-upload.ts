import { MEDIA_ACCEPT, mediaType, refuseType } from "@floc/core/media/media";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { fetch as streamingFetch } from "expo/fetch";

import { API_BASE_URL } from "@/lib/config";

type Target = { uploadUrl: string; uploadToken: string; placeId: number | null };

async function sendOne(target: Target, uri: string, mimeType: string | undefined): Promise<string | null> {
  const type = mediaType(mimeType);
  if (!type) return refuseType(mimeType);
  const query = target.placeId === null ? "" : `?place=${target.placeId}`;
  const response = await streamingFetch(`${API_BASE_URL}${target.uploadUrl}${query}`, {
    method: "POST",
    headers: { "Content-Type": type.mimeType, "x-floc-media-token": target.uploadToken },
    body: new File(uri),
  });
  if (response.ok) return null;
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "That file could not be added.";
}

export async function pickAndSendMedia(target: Target): Promise<{ added: number; problem: string | null; video: boolean }> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: MEDIA_ACCEPT.split(","),
    copyToCacheDirectory: true,
    multiple: true,
  });
  if (picked.canceled) return { added: 0, problem: null, video: false };
  let added = 0;
  let problem: string | null = null;
  for (const asset of picked.assets) {
    const refused = await sendOne(target, asset.uri, asset.mimeType).catch(() => "That file could not be added.");
    if (refused) problem = refused;
    else added += 1;
  }
  return { added, problem, video: picked.assets.some((asset) => asset.mimeType?.startsWith("video/")) };
}
