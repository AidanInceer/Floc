/**
 * The Documents page (ticket 239; workspace choices C). Shared and Yours side
 * by side on a desk, stacked on a phone, under one filter row — a documents
 * list is a dozen rows, not hundreds, so per-list controls would cost more
 * than they organise.
 */
import Link from "next/link";

import { requireTripAccess } from "@/server/access";
import { listDocuments } from "@/server/documents/documents";
import { storageUsage } from "@/server/documents/storage-quota";
import type { TripDocument } from "@/server/documents/documents";
import { documentsEnabled } from "@/server/documents/document-store";
import {
  DOC_CATEGORIES,
  DOC_CATEGORY_LABELS,
  parseCategoryFilter,
} from "@floc/core/documents/documents";
import { StorageMeter } from "@/components/documents/storage-meter";
import type { DocCategory } from "@floc/core/documents/documents";
import { DocumentRow } from "@/components/documents/document-row";
import { DocumentFiling } from "@/components/documents/document-filing";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentRenameForm } from "@/components/documents/document-rename";
import { ConfirmSubmit, Menu, Sheet } from "@/components/system/client-ui";
import { cx, menuDangerItemClass, menuItemClass, PageTitle } from "@/components/system/ui";
import { removeDocument, renameDocument } from "./actions";

export const metadata = { title: "Files" };

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
  const [docs, space] = documentsEnabled()
    ? await Promise.all([listDocuments(tripId, viewerId), storageUsage(tripId)])
    : [[], null];

  const keep = (d: TripDocument) => category === "all" || d.category === category;
  const shared = docs.filter((d) => d.ownerId === null && keep(d));
  const mine = docs.filter((d) => d.ownerId !== null && keep(d));

  const href = (c: DocCategory | "all") =>
    `/trip/${tripId}/files${c === "all" ? "" : `?category=${c}`}`;

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle>Files</PageTitle>

      {!documentsEnabled() ? (
        // Rule 11: say what is missing rather than offering an upload that
        // cannot land anywhere.
        <p className="mt-6 rounded-xl border border-rule bg-sheet px-4 py-8 text-center text-sm text-ink-soft">
          File storage isn&rsquo;t set up yet, so there is nowhere to put a document. Nothing else
          on the trip is affected.
        </p>
      ) : (
        <>
          {/* The pills scroll rather than wrap: wrapping dropped Upload onto a
              second line at phone width, where it read as a stray button. */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="scroll-x-bare flex min-w-0 flex-1 items-center gap-1">
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

          <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,1fr)] lg:gap-4">
            <FileCard
              title="Shared"
              note="Everyone on the trip"
              empty={
                category === "all"
                  ? "Add the first file with Upload — bookings and tickets go here."
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
                category === "all" ? "Nothing of your own yet." : "Nothing of yours is filed here."
              }
              docs={mine}
              tripId={tripId}
              viewerId={viewerId}
            />
          </div>

          {space ? <StorageMeter {...space} /> : null}
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
  // No `overflow-hidden` on the card: a row's re-file menu opens inside it,
  // and clipping the frame clips the menu.
  return (
    <section className="min-w-0">
      <header className="mb-2 flex items-baseline gap-2.5">
        <h2 className="font-display text-[1.05rem] font-semibold">{title}</h2>
        <span className="text-xs text-ink-soft">{note}</span>
      </header>
      <div className="rounded-2xl border border-rule bg-sheet">
        {docs.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-soft">{empty}</p>
        ) : (
          <ul className="divide-y divide-rule">
            {docs.map((doc) => (
              <DocumentRow
                key={doc.id}
                tripId={tripId}
                doc={doc}
                mine={doc.uploadedBy === viewerId}
                filing={
                  <DocumentFiling tripId={tripId} documentId={doc.id} category={doc.category} />
                }
              >
                <Menu label={`More for ${doc.name}`}>
                  <Sheet
                    bareTrigger
                    trigger="Rename"
                    title="Rename file"
                    triggerClassName={menuItemClass}
                    keepOpenOnSubmit
                  >
                    <DocumentRenameForm
                      name={doc.name}
                      rename={renameDocument.bind(null, tripId, doc.id)}
                    />
                  </Sheet>
                  <form action={removeDocument.bind(null, tripId, doc.id)}>
                    <ConfirmSubmit
                      variant="ghost"
                      confirmVariant="danger"
                      confirmLabel="Remove it"
                      message="Remove this file? It goes for everyone who could see it."
                      className={menuDangerItemClass}
                    >
                      Remove
                    </ConfirmSubmit>
                  </form>
                </Menu>
              </DocumentRow>
            ))}
          </ul>
        )}
      </div>
    </section>
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
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
        on
          ? "border-ink bg-ink text-sheet"
          : "border-transparent text-ink-soft hover:border-rule-strong hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
