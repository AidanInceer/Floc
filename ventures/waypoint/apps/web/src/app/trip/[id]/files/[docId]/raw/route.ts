/**
 * Serves one document's bytes (ticket 239). The whole access check is
 * `access.document`: it binds the id to this trip and to a row the viewer may
 * see, and answers `notFound()` for anything else — a non-member, another
 * member's private file and a made-up id are indistinguishable (rule 5).
 *
 * Inline, so a PDF or an image opens in a new tab and the browser renders it.
 */
import { notFound } from "next/navigation";

import { requireTripAccess } from "@/server/access";
import { readDocument } from "@/server/document-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;
  const access = await requireTripAccess(id);
  const documentId = Number(docId);
  if (!Number.isInteger(documentId)) notFound();

  const doc = await access.document(documentId);
  const bytes = await readDocument(doc.storageKey);
  if (!bytes) notFound();

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(bytes.length),
      // The name is user-supplied, so only ASCII goes in the quoted form and
      // the real thing rides in `filename*` where it can be encoded.
      "Content-Disposition": `inline; filename="${doc.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
      // Private files must never sit in a shared cache.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // These bytes are never a page. The allow-list already excludes SVG and
      // HTML, but a crafted PDF still renders inline on the app's own origin,
      // and the app sets no global CSP — so this response carries its own.
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
