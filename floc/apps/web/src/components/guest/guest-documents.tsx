/**
 * The files a guest can see the shape of and nothing more (#330).
 *
 * Grey names, dead clicks — Aidan's call. The names prove the trip is real
 * without handing over a byte: there is no link, no download, no `storageKey`
 * on `GuestDocument` to build one from, and the serve route only answers a
 * member anyway. A guest's own member's private files never reach this list,
 * shared ones only.
 *
 * Drawn as rows that are plainly off — a lock on each, the whole list dimmed —
 * rather than as working rows that swallow a click. A control that looks alive
 * and does nothing reads as a bug.
 */
import type { GuestDocument } from "@/server/trips/guest-view";
import { DOC_CATEGORY_LABELS } from "@floc/core/documents/documents";
import { SectionHeading } from "@/components/system/ui";

export function GuestDocuments({ docs }: { docs: GuestDocument[] }) {
  return (
    <section className="rounded-lg bg-sheet p-4 ring-1 ring-rule sm:p-6">
      <SectionHeading>Files</SectionHeading>

      {docs.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          No files have been shared on this trip.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-soft">
            The group&rsquo;s files open for the people on the trip.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 rounded-sm border border-rule bg-sheet-2 px-3 py-2.5"
              >
                <LockGlyph />
                <span className="min-w-0 flex-1 truncate text-sm text-ink-faint">
                  {d.name}
                </span>
                <span className="typed">{DOC_CATEGORY_LABELS[d.category]}</span>
                <span className="typed">Locked</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function LockGlyph() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 text-ink-faint"
    >
      <rect x={2.75} y={6} width={8.5} height={5.75} rx={1.1} />
      <path d="M4.75 6V4.4a2.25 2.25 0 0 1 4.5 0V6" />
    </svg>
  );
}
