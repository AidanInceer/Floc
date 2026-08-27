/**
 * One document, as a row (ticket 239). Presentational only — no actions, no
 * fetching — so the Overview block (client) and the Files page (server) render
 * the identical thing.
 */
import { formatBytes, kindLabel } from "@/lib/documents";
import { cx } from "@/components/ui";

export type DocumentRowData = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
};

/** Blush for a PDF, peri for an image — with the word, never the colour alone. */
function KindChip({ mimeType }: { mimeType: string }) {
  const label = kindLabel(mimeType);
  return (
    <span
      className={cx(
        "inline-flex w-11 shrink-0 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
        label === "PDF" ? "bg-blush text-blush-ink" : "bg-peri text-peri-ink",
      )}
    >
      {label}
    </span>
  );
}

export function DocumentRow({
  tripId,
  doc,
  mine,
  children,
}: {
  tripId: number;
  doc: DocumentRowData;
  /** Uploaded by the viewer — the byline says "You" rather than their name. */
  mine: boolean;
  /** The remove control, where the page has one to give. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-rule-soft py-2.5 last:border-b-0">
      <KindChip mimeType={doc.mimeType} />
      <a
        href={`/trip/${tripId}/files/${doc.id}/raw`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm font-semibold text-pen hover:underline"
      >
        {doc.name}
      </a>
      {doc.ownerId ? (
        <span className="shrink-0 rounded-full bg-butter px-2 py-0.5 text-xs text-butter-ink">
          private
        </span>
      ) : null}
      <span className="nums shrink-0 text-xs text-ink-soft">
        {mine ? "You" : doc.uploaderName} &middot; {formatBytes(doc.sizeBytes)}
      </span>
      {children}
    </div>
  );
}
