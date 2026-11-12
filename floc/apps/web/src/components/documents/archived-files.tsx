import { fileArchiveLeftLabel, fileArchiveNote } from "@floc/core/documents/archive";
import { formatBytes } from "@floc/core/documents/documents";

import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import type { ArchivedFile } from "@/server/documents/archive/archive";

import { CategoryChip, KindChip } from "./document-row";

/** Removed files, waiting out their week (ADR-048). Restore is the only verb: nothing here deletes. */
export function ArchivedFiles({
  files,
  viewerId,
  now,
  restore,
}: {
  files: ArchivedFile[];
  viewerId: string;
  now: Date;
  /** `restoreDocument`, bound to the trip. */
  restore: (documentId: number) => Promise<{ error?: string }>;
}) {
  if (files.length === 0) return null;
  return (
    <section className="mt-6 min-w-0">
      <header className="mb-2 flex items-baseline gap-2.5">
        <h2 className="font-display text-[1.05rem] font-semibold">Archived</h2>
        <span className="text-xs text-ink-soft">{fileArchiveNote}</span>
      </header>
      <ul className="divide-y divide-rule rounded-md border border-rule bg-sheet">
        {files.map((file) => (
          <li key={file.id}>
            <ActionForm
              action={restore.bind(null, file.id)}
              className="flex min-h-14 flex-wrap items-center gap-x-2.5 px-3 py-2"
              errorClassName="basis-full pt-1"
            >
              {/* Why hidden on a phone: the category chip needs its width, and the name keeps the extension. */}
              <span className="max-sm:hidden">
                <KindChip mimeType={file.mimeType} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col leading-snug">
                {/* Why two lines on a phone: the row is not a link, so a cut name could be read nowhere else. */}
                <span className="text-sm font-medium max-sm:line-clamp-2 sm:truncate">{file.name}</span>
                {/* Why two halves: on a phone the line breaks between them, never after a dot. */}
                <span className="nums flex flex-col gap-y-0.5 text-xs text-ink-soft sm:flex-row sm:gap-x-1.5">
                  <span className="whitespace-nowrap">
                    {fileArchiveLeftLabel(file.archivedAt, now)} &middot; {file.ownerId ? "Yours" : "Shared"}
                  </span>
                  <span className="max-sm:hidden">&middot;</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="sm:hidden">
                      <CategoryChip category={file.category} />
                    </span>
                    <span className="truncate">{byline(file, viewerId)}</span>
                  </span>
                </span>
              </div>
              <span className="max-sm:hidden">
                <CategoryChip category={file.category} />
              </span>
              <SubmitButton variant="secondary">Restore</SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Why no name on a private file: only its owner sees it, so "Yours" has already said who. */
function byline(file: ArchivedFile, viewerId: string): string {
  const size = formatBytes(file.sizeBytes);
  if (file.ownerId) return size;
  return `${file.uploadedBy === viewerId ? "You" : file.uploaderName} · ${size}`;
}
