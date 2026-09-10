/**
 * The Documents page (ticket 239, wireframe v3b). Shaped like Packing: two
 * stacked cards — the group's files, then your own — rather than a table with
 * a filter rail beside it.
 *
 * One filter bar and row chips rather than Packing's per-list controls and
 * heading strips: a documents list is a dozen rows, not hundreds, so both would
 * cost more than they organise.
 *
 * Not a tab: documents are fetched, not a stage of planning.
 */
import Link from "next/link";

import { requireTripAccess } from "@/server/access";
import { listDocuments } from "@/server/documents/documents";
import type { TripDocument } from "@/server/documents/documents";
import { documentsEnabled } from "@/server/documents/document-store";
import {
  DOC_CATEGORIES,
  DOC_CATEGORY_LABELS,
  parseCategoryFilter,
} from "@floc/core/documents/documents";
import type { DocCategory } from "@floc/core/documents/documents";
import { DocumentRow } from "@/components/documents/document-row";
import { DocumentFiling } from "@/components/documents/document-filing";
import { DocumentUpload } from "@/components/documents/document-upload";
import { ConfirmSubmit } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";
import { removeDocument } from "./actions";

export default async function FilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/files`);
  const tripId = access.trip.id;
  const viewerId = access.viewer.id;

  const category = parseCategoryFilter((await searchParams).category);
  const docs = documentsEnabled() ? await listDocuments(tripId, viewerId) : [];

  const keep = (d: TripDocument) =>
    category === "all" || d.category === category;
  const shared = docs.filter((d) => d.ownerId === null && keep(d));
  const mine = docs.filter((d) => d.ownerId !== null && keep(d));

  const href = (c: DocCategory | "all") =>
    `/trip/${tripId}/files${c === "all" ? "" : `?category=${c}`}`;

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Documents</h1>
        <Link
          href={`/trip/${tripId}/overview`}
          className="text-sm text-pen hover:underline"
        >
          &larr; Overview
        </Link>
      </div>

      {!documentsEnabled() ? (
        // Rule 11: say what is missing rather than offering an upload that
        // cannot land anywhere.
        <p className="mt-6 rounded-xl border border-rule bg-sheet px-4 py-8 text-center text-sm text-ink-soft">
          File storage isn&rsquo;t set up yet, so there is nowhere to put a
          document. Nothing else on the trip is affected.
        </p>
      ) : (
        <>
          {/* The pills scroll rather than wrap: wrapping dropped Upload onto a
              second line at phone width, where it read as a stray button. */}
          <div className="mt-5 flex items-center gap-2 rounded-full border border-rule bg-sheet px-3 py-2.5">
            <div className="scroll-x-bare flex min-w-0 flex-1 items-center gap-2">
              <FilterPill href={href("all")} on={category === "all"}>
                All
              </FilterPill>
              {DOC_CATEGORIES.map((c) => {
                const n = docs.filter((d) => d.category === c).length;
                // A heading nothing is filed under is a control that does
                // nothing — it appears when something lands there.
                if (n === 0 && category !== c) return null;
                return (
                  <FilterPill key={c} href={href(c)} on={category === c}>
                    {DOC_CATEGORY_LABELS[c]} &middot; {n}
                  </FilterPill>
                );
              })}
            </div>
            <span className="shrink-0">
              <DocumentUpload tripId={tripId} scope="shared" />
            </span>
          </div>

          <FileCard
            title="Shared"
            note="Everyone on the trip"
            empty={
              category === "all"
                ? "Nothing shared yet — bookings and tickets go here."
                : "Nothing shared is filed here."
            }
            docs={shared}
            tripId={tripId}
            viewerId={viewerId}
          />

          <FileCard
            title="Yours"
            note="Only you can see these"
            empty={
              category === "all"
                ? "Nothing of your own yet."
                : "Nothing of yours is filed here."
            }
            docs={mine}
            tripId={tripId}
            viewerId={viewerId}
          />
        </>
      )}
    </div>
  );
}

function FileCard({
  title,
  note,
  empty,
  docs,
  tripId,
  viewerId,
}: {
  title: string;
  note: string;
  empty: string;
  docs: TripDocument[];
  tripId: number;
  viewerId: string;
}) {
  // No `overflow-hidden` on the card, unlike Packing's: a row's re-file menu
  // opens inside it, and clipping the frame clips the menu. The summary rounds
  // its own top corners instead.
  return (
    <details
      open
      className="group/card mt-6 rounded-xl border border-rule bg-sheet"
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 rounded-t-xl border-b border-rule bg-sheet-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-ink-faint transition-transform group-open/card:rotate-90">
          &#9656;
        </span>
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
          {note}
        </span>
      </summary>

      {docs.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="divide-y divide-rule">
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              tripId={tripId}
              doc={doc}
              mine={doc.uploadedBy === viewerId}
              filing={
                <DocumentFiling
                  tripId={tripId}
                  documentId={doc.id}
                  category={doc.category}
                />
              }
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
          ))}
        </ul>
      )}
    </details>
  );
}

function FilterPill({
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
        "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors",
        on
          ? "bg-ink text-sheet"
          : "border border-rule text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
