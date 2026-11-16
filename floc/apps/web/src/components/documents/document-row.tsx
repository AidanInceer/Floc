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
  dayEventId?: number | null;
  eventTitle?: string | null;
};

export function KindChip({ mimeType }: { mimeType: string }) {
  return (
    <span className="inline-flex w-10 shrink-0 justify-center rounded-full bg-sheet-3 py-0.5 font-mono text-[11px] text-ink-soft">
      {kindLabel(mimeType)}
    </span>
  );
}

export function CategoryChip({ category }: { category: DocCategory }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.05em]",
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
  mine: boolean;
  filing?: React.ReactNode;
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
