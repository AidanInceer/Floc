import { findTripAccess } from "@/server/access";
import { mediaTokenHolder } from "@/server/media/media-link";
import { saveMedia } from "@/server/media/media-save";

export const runtime = "nodejs";

const wholeOrNull = (raw: string | null) => {
  const value = Number(raw);
  return raw && Number.isInteger(value) && value > 0 ? value : null;
};

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const tripId = Number((await params).tripId);
  const token = request.headers.get("x-floc-media-token");
  const viewerId = Number.isInteger(tripId) && token ? mediaTokenHolder(token, "upload", tripId) : null;
  if (!viewerId) return Response.json({ error: "Sign in again to add this." }, { status: 401 });
  const access = await findTripAccess(tripId, viewerId);
  if (!access) return Response.json({ error: "No such trip." }, { status: 404 });
  if (!request.body) return Response.json({ error: "That file is empty." }, { status: 400 });

  const query = new URL(request.url).searchParams;
  const saved = await saveMedia(access, {
    body: request.body,
    mimeType: request.headers.get("content-type") ?? "",
    declaredBytes: wholeOrNull(request.headers.get("content-length")),
    placeId: wholeOrNull(query.get("place")),
    width: wholeOrNull(query.get("w")),
    height: wholeOrNull(query.get("h")),
    durationSeconds: wholeOrNull(query.get("d")),
  });
  return Response.json(saved, { status: saved.error ? 422 : 201 });
}
