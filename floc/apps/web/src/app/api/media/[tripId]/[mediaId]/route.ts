import { notFound } from "next/navigation";

import { findTripAccess, requireTripAccess } from "@/server/access";
import { mediaTokenHolder } from "@/server/media/media-link";
import { liveMedia } from "@/server/media/media-rows";
import { fileSize, parseRange, streamMedia, thumbKeyOf } from "@/server/media/media-store";

export const runtime = "nodejs";

async function memberMayView(request: Request, tripId: number): Promise<boolean> {
  const token = new URL(request.url).searchParams.get("t");
  if (!token) return Boolean(await requireTripAccess(tripId));
  const viewerId = mediaTokenHolder(token, "view", tripId);
  return Boolean(viewerId && (await findTripAccess(tripId, viewerId)));
}

export async function GET(request: Request, { params }: { params: Promise<{ tripId: string; mediaId: string }> }) {
  const { tripId: rawTrip, mediaId: rawMedia } = await params;
  const tripId = Number(rawTrip);
  const mediaId = Number(rawMedia);
  if (!Number.isInteger(tripId) || !Number.isInteger(mediaId)) notFound();
  if (!(await memberMayView(request, tripId))) notFound();
  const row = await liveMedia(tripId, mediaId);
  if (!row) notFound();

  const wantsThumb = new URL(request.url).searchParams.get("size") === "thumb" && row.kind === "photo";
  const storageKey = wantsThumb ? thumbKeyOf(row.storageKey) : row.storageKey;
  const size = await fileSize(storageKey);
  if (size === null) notFound();

  const headers: Record<string, string> = {
    "Content-Type": wantsThumb ? "image/webp" : row.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Disposition": "inline",
  };
  const range = parseRange(request.headers.get("range"), size);
  if (range === "invalid") return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  if (!range) {
    return new Response(streamMedia(storageKey), { headers: { ...headers, "Content-Length": String(size) } });
  }
  return new Response(streamMedia(storageKey, range), {
    status: 206,
    headers: {
      ...headers,
      "Content-Length": String(range.end - range.start + 1),
      "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
    },
  });
}
