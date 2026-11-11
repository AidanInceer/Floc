/**
 * The files on one event, inside its modal (ticket 322). The boarding pass
 * sits on the ferry, not in a folder with eleven others.
 *
 * Private files are the group's own rows and nobody else's: the read is
 * already scoped, so anything arriving here is the viewer's to see — the tag
 * says which of them the rest of the trip cannot.
 */
import { detachFromEvent } from "@/app/trip/[id]/files/actions";
import {
  AttachExistingFile,
  type FileChoice,
} from "@/components/documents/attach-existing";
import { DocumentRow } from "@/components/documents/document-row";
import { DocumentUpload } from "@/components/documents/document-upload";
import { SubmitButton } from "@/components/system/client-ui";
import { panelBandClass, panelTitleClass } from "@/components/system/ui";
import type { TripDocument } from "@/server/documents/documents";

export function EventFiles({
  tripId,
  dayEventId,
  files,
  loose,
  viewerId,
}: {
  tripId: number;
  dayEventId: number;
  files: TripDocument[];
  /** The trip's files sitting on no event — what "Link a file" may offer. */
  loose: FileChoice[];
  viewerId: string;
}) {
  return (
    <section className={panelBandClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={panelTitleClass}>Files</h3>
        <div className="flex items-center gap-1">
          {loose.length > 0 ? (
            <AttachExistingFile
              tripId={tripId}
              dayEventId={dayEventId}
              choices={loose}
            />
          ) : null}
          <DocumentUpload tripId={tripId} scope="shared" dayEventId={dayEventId} triggerVariant="secondary" />
        </div>
      </div>

      {files.length === 0 ? null : (
        // Why: *:px-0 drops the Files page row inset, so chips and rules sit on the panel's content edge.
        <ul className="mt-1 divide-y divide-rule *:px-0">
          {files.map((doc) => (
            <DocumentRow
              key={doc.id}
              tripId={tripId}
              // No "on …" tag in here: the modal is already the event.
              doc={{ ...doc, dayEventId: null }}
              mine={doc.uploadedBy === viewerId}
            >
              {doc.ownerId !== null ? (
                <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.05em] text-ink-faint">
                  Just you
                </span>
              ) : null}
              {/* Not a confirm: the file stays on the Files page, so there is
                  nothing to lose by pressing it. */}
              <form action={detachFromEvent.bind(null, tripId, doc.id)}>
                <SubmitButton variant="ghost">
                  Detach
                </SubmitButton>
              </form>
            </DocumentRow>
          ))}
        </ul>
      )}
    </section>
  );
}
