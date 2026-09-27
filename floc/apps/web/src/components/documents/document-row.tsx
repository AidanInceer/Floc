/**
 * One document, as a row (ticket 239). Presentational only — no fetching — so
 * the Overview block (client) and the Files page (server) render the same
 * thing. Anything that acts on the row arrives as `children`.
 */
import Link from "next/link";

import {
  DOC_CATEGORY_LABELS,
  DOC_CATEGORY_SKINS,
  formatBytes,
  kindLabel,
} from "@floc/core/documents/documents";
import type { DocCategory } from "@floc/core/documents/documents";
import { cx } from "@/components/system/ui";

export type DocumentRowData = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
  /** Set when the file sits on a live event (ticket 323). */
  dayEventId?: number | null;
  eventTitle?: string | null;
};

/** Red for a PDF, blue for an image — with the word, never the colour alone. */
function KindChip({ mimeType }: { mimeType: string }) {
  const label = kindLabel(mimeType);
  return (
    <span
      className={cx(
        "inline-flex w-10 shrink-0 justify-center rounded-full py-0.5 font-mono text-[10px]",
        label === "PDF"
          ? "bg-pastel-red text-pastel-red-ink"
          : "bg-pastel-blue text-pastel-blue-ink",
      )}
    >
      {label}
    </span>
  );
}

/** The filing, as a chip. Static here; the Files page wraps it in its menu. */
export function CategoryChip({ category }: { category: DocCategory }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.05em]",
        DOC_CATEGORY_SKINS[category],
      )}
    >
      {DOC_CATEGORY_LABELS[category]}
    </span>
  );
}

export function DocumentRow({
  tripId,
  doc,
  mine,
  filing,
  children,
}: {
  tripId: number;
  doc: DocumentRowData;
  /** Uploaded by the viewer — the byline says "You" rather than their name. */
  mine: boolean;
  /** The re-file control. Absent on Overview, where the row is a preview. */
  filing?: React.ReactNode;
  /** Anything else that acts on the row — removal, on the Files page. */
  children?: React.ReactNode;
}) {
  return (
    <li className="flex min-h-14 items-center gap-2.5 px-3 py-2">
      <KindChip mimeType={doc.mimeType} />
      <div className="flex min-w-0 flex-1 flex-col leading-snug">
        <a
          href={`/trip/${tripId}/files/${doc.id}/raw`}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-medium text-pen hover:underline"
        >
          {doc.name}
        </a>
        <span className="nums truncate text-xs text-ink-soft">
          {mine ? "You" : doc.uploaderName} &middot; {formatBytes(doc.sizeBytes)}
          {doc.dayEventId ? (
            <>
              {" "}
              &middot;{" "}
              <Link
                href={`/trip/${tripId}/days?event=${doc.dayEventId}`}
                className="text-pen hover:underline"
              >
                on {doc.eventTitle ?? "an event"}
              </Link>
            </>
          ) : null}
        </span>
      </div>
      {filing ?? <CategoryChip category={doc.category} />}
      {children}
    </li>
  );
}
