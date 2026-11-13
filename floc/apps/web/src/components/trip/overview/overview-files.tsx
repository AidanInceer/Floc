// Why: the legs already show each file; this counts them by kind and points at the Files tab.
import Link from "next/link";

import { DOC_CATEGORY_LABELS, DOC_CATEGORY_SKINS, type DocCategory } from "@floc/core/documents/documents";
import { filesByCategory } from "@floc/core/trip/overview/legs";
import { cx, iconFrameClass } from "@/components/system/ui";
import { DocCategoryIcon } from "@/components/system/icons/doc-category";
import { DocumentUpload } from "@/components/documents/document-upload";
import { UploadIcon } from "@/components/system/icons";

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
              <span className={cx("grid h-[22px] w-[22px] place-items-center rounded-sm", DOC_CATEGORY_SKINS[category])}>
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
        className={cx(iconFrameClass(), "max-md:ml-auto")}
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

