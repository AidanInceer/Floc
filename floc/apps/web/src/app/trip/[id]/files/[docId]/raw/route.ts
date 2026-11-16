import { notFound } from "next/navigation";

import { requireTripAccess } from "@/server/access";
import { readDocument } from "@/server/documents/document-store";
import { liveDocument } from "@/server/documents/documents";
import { viewTokenHolds } from "@/server/documents/view-link";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;
  const documentId = Number(docId);
  if (!Number.isInteger(documentId)) notFound();

  const token = new URL(request.url).searchParams.get("t");
  const doc = token
    ? viewTokenHolds(token, documentId)
      ? await liveDocument(documentId)
      : undefined
    : await (await requireTripAccess(id)).document(documentId);
  if (!doc || doc.tripId !== Number(id)) notFound();

  const bytes = await readDocument(doc.storageKey);
  if (!bytes) notFound();

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="${doc.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
