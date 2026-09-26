// Why: the legs already show each file; this counts them by kind and points at the Files tab.
import Link from "next/link";

import { DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { filesByCategory } from "@floc/core/trip/overview/legs";
import { DocCategoryIcon } from "@/components/documents/doc-category-icon";
import { DocumentUpload } from "@/components/documents/document-upload";

export function OverviewFiles({ tripId, files }: { tripId: number; files: { category: DocCategory }[] }) {
  const counts = filesByCategory(files);
  return (
    <section className="flex min-w-0 flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg">
          Files
          {files.length > 0 ? <span className="nums text-xs font-normal text-ink-faint">{files.length}</span> : null}
        </h2>
        <span className="ml-auto">
          <DocumentUpload tripId={tripId} scope="shared" />
        </span>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No tickets or bookings yet.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {counts.map(({ category, count }) => (
              <Link
                key={category}
                href={`/trip/${tripId}/files?category=${category}`}
                className="lift inline-flex items-center gap-2 rounded-full border border-pastel-red-edge bg-pastel-red py-1 pl-3 pr-1.5 text-sm text-pastel-red-ink"
              >
                <DocCategoryIcon category={category} />
                <span className="text-ink">{DOC_CATEGORY_LABELS[category]}</span>
                <b className="nums grid h-5 min-w-5 place-items-center rounded-full bg-sheet px-1.5 text-[11px] font-medium">{count}</b>
              </Link>
            ))}
          </div>
          <Link href={`/trip/${tripId}/files`} className="self-start text-sm text-pen hover:underline">
            All {files.length} {files.length === 1 ? "file" : "files"} &rarr;
          </Link>
        </>
      )}
    </section>
  );
}
