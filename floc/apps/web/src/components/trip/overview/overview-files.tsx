// Why: the legs already show each file; this counts them by kind and points at the Files tab.
import Link from "next/link";

import { DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { filesByCategory } from "@floc/core/trip/overview/legs";
import { cx } from "@/components/system/ui";
import { DocCategoryIcon } from "@/components/documents/doc-category-icon";
import { DocumentUpload } from "@/components/documents/document-upload";

const TINT: Record<DocCategory, string> = {
  travel: "bg-pastel-blue text-pastel-blue-ink",
  stay: "bg-pastel-green text-pastel-green-ink",
  tickets: "bg-pastel-yellow text-pastel-yellow-ink",
  admin: "bg-pastel-red text-pastel-red-ink",
  other: "bg-pastel-red text-pastel-red-ink",
};

export function OverviewFiles({ tripId, files }: { tripId: number; files: { category: DocCategory }[] }) {
  const counts = filesByCategory(files);
  return (
    <section className="flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-2 md:ml-auto md:border-l md:border-rule md:pl-7 max-md:border-t max-md:border-rule max-md:pt-3">
      <h2 className="font-display text-base font-semibold">
        <Link href={`/trip/${tripId}/files`} className="text-ink hover:underline">
          Files
        </Link>
      </h2>
      {files.length === 0 ? (
        <p className="text-sm text-ink-faint">No tickets or bookings yet</p>
      ) : (
        <span className="flex flex-wrap gap-x-3.5 gap-y-1">
          {counts.map(({ category, count }) => (
            <Link
              key={category}
              href={`/trip/${tripId}/files?category=${category}`}
              className="inline-flex items-center gap-1.5 text-sm text-ink hover:underline"
            >
              <span className={cx("grid h-[22px] w-[22px] place-items-center rounded-md", TINT[category])}>
                <DocCategoryIcon category={category} size={11} />
              </span>
              {DOC_CATEGORY_LABELS[category]}
              <span className="nums text-xs text-ink-faint">{count}</span>
            </Link>
          ))}
        </span>
      )}
      <DocumentUpload
        tripId={tripId}
        scope="shared"
        bareTrigger
        className="grid h-[30px] w-[30px] place-items-center rounded-full border border-rule-strong bg-sheet text-ink-soft hover:bg-sheet-2 hover:text-ink max-md:ml-auto"
        trigger={
          <>
            <UploadIcon />
            <span className="sr-only">Upload</span>
          </>
        }
      />
    </section>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 14 14" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 9.4V2.6M4.4 5.2 7 2.6l2.6 2.6M2.4 9.4v1.4a1 1 0 0 0 1 1h7.2a1 1 0 0 0 1-1V9.4" />
    </svg>
  );
}
