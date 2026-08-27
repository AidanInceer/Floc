/**
 * The Documents page (ticket 239, mockup v2) — the whole pile as a table, with
 * a left rail that narrows it. Not a tab: it is reached from the Overview
 * block's "See all", because documents are something you go and fetch, not a
 * stage of planning the trip.
 *
 * Filters live in the query string, so a filtered view is a link you can send.
 */
import Link from "next/link";

import { requireTripAccess } from "@/server/access";
import { listDocuments } from "@/server/documents";
import { documentsEnabled } from "@/server/document-store";
import { documentKind, formatBytes } from "@/lib/documents";
import { DocumentRow } from "@/components/document-row";
import { DocumentUpload } from "@/components/document-upload";
import { EmptyState, cx } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { removeDocument } from "./actions";

type Show = "all" | "shared" | "yours";
type Kind = "all" | "pdf" | "image";

export default async function FilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show?: string; kind?: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/files`);
  const tripId = access.trip.id;
  const viewerId = access.viewer.id;
  const query = await searchParams;

  const show: Show =
    query.show === "shared" || query.show === "yours" ? query.show : "all";
  const kind: Kind =
    query.kind === "pdf" || query.kind === "image" ? query.kind : "all";

  const docs = documentsEnabled() ? await listDocuments(tripId, viewerId) : [];
  const sharedCount = docs.filter((d) => d.ownerId === null).length;
  const pdfCount = docs.filter((d) => documentKind(d.mimeType) === "pdf").length;

  const shown = docs.filter(
    (d) =>
      (show === "all" ||
        (show === "shared" ? d.ownerId === null : d.ownerId !== null)) &&
      (kind === "all" || documentKind(d.mimeType) === kind),
  );
  const totalBytes = docs.reduce((sum, d) => sum + d.sizeBytes, 0);

  const href = (patch: { show?: Show; kind?: Kind }) => {
    const next = new URLSearchParams();
    const s = patch.show ?? show;
    const k = patch.kind ?? kind;
    if (s !== "all") next.set("show", s);
    if (k !== "all") next.set("kind", k);
    const q = next.toString();
    return `/trip/${tripId}/files${q ? `?${q}` : ""}`;
  };

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/trip/${tripId}/overview`}
          className="rounded-full border border-rule bg-sheet px-3 py-1.5 text-sm text-pen"
        >
          &larr; Overview
        </Link>
        <h1 className="font-display text-2xl">Documents</h1>
      </div>
      <p className="nums mt-1 text-sm text-ink-soft">
        {docs.length} {docs.length === 1 ? "file" : "files"}
        {docs.length > 0 ? ` · ${formatBytes(totalBytes)}` : ""}
      </p>

      {!documentsEnabled() ? (
        <div className="mt-6">
          {/* Rule 11: the volume is missing, so say what is missing rather
              than offering an upload that cannot land anywhere. */}
          <EmptyState title="File storage isn't set up">
            Documents need a storage volume. Nothing is lost — uploading is off
            until one is mounted.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-[11rem_1fr]">
          <aside className="h-max rounded-lg bg-sheet p-4 ring-1 ring-rule">
            <p className="text-xs uppercase tracking-wide text-ink-soft">Show</p>
            <div className="mt-2 flex flex-col gap-1">
              <RailLink href={href({ show: "all" })} on={show === "all"}>
                All
              </RailLink>
              <RailLink href={href({ show: "shared" })} on={show === "shared"}>
                Shared &middot; {sharedCount}
              </RailLink>
              <RailLink href={href({ show: "yours" })} on={show === "yours"}>
                Yours &middot; {docs.length - sharedCount}
              </RailLink>
            </div>
            <p className="mt-4 text-xs uppercase tracking-wide text-ink-soft">
              Type
            </p>
            <div className="mt-2 flex flex-col gap-1">
              <RailLink href={href({ kind: "all" })} on={kind === "all"}>
                Any
              </RailLink>
              <RailLink href={href({ kind: "pdf" })} on={kind === "pdf"}>
                PDF &middot; {pdfCount}
              </RailLink>
              <RailLink href={href({ kind: "image" })} on={kind === "image"}>
                Image &middot; {docs.length - pdfCount}
              </RailLink>
            </div>
            <div className="mt-4">
              <DocumentUpload
                tripId={tripId}
                scope={show === "yours" ? "private" : "shared"}
                className="!w-full !justify-center"
              />
            </div>
          </aside>

          <div className="rounded-lg bg-sheet px-4 py-2 ring-1 ring-rule">
            {shown.length === 0 ? (
              <div className="py-8">
                <EmptyState title="No files here">
                  Bookings, tickets and visas live on this page.
                </EmptyState>
              </div>
            ) : (
              shown.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  tripId={tripId}
                  doc={doc}
                  mine={doc.uploadedBy === viewerId}
                >
                  {doc.uploadedBy === viewerId ? (
                    <form action={removeDocument.bind(null, tripId, doc.id)}>
                      <ConfirmSubmit
                        variant="ghost"
                        confirmVariant="danger"
                        confirmLabel="Remove it"
                        message="Remove this file? It goes for everyone who could see it."
                      >
                        Remove
                      </ConfirmSubmit>
                    </form>
                  ) : null}
                </DocumentRow>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RailLink({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "rounded-full px-3 py-1.5 text-sm transition-colors",
        on
          ? "bg-pen text-sheet"
          : "border border-rule text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
