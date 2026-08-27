"use client";

/**
 * The Overview's Documents block (ticket 239, mockup v2) — one dense list with
 * a Shared/Yours toggle rather than two rows of cards, so it costs the page a
 * few rows of height instead of a screen.
 *
 * Client for the toggle alone: both lists arrive whole and switching between
 * them is not worth a round trip.
 */
import Link from "next/link";
import { useState } from "react";

import { DocumentRow } from "@/components/document-row";
import type { DocumentRowData } from "@/components/document-row";
import { DocumentUpload } from "@/components/document-upload";
import { PillToggle } from "@/components/client-ui";

/** Three rows. More than that and the day track below it is off the screen. */
const PREVIEW = 3;

export function DocumentsBlock({
  tripId,
  docs,
  viewerId,
}: {
  tripId: number;
  docs: DocumentRowData[];
  viewerId: string;
}) {
  const [scope, setScope] = useState<"shared" | "private">("shared");
  const shared = docs.filter((d) => d.ownerId === null);
  const mine = docs.filter((d) => d.ownerId !== null);
  const shown = scope === "shared" ? shared : mine;

  return (
    <section className="mt-4 rounded-lg bg-sheet p-6 ring-1 ring-rule">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg">Documents</h2>
          <PillToggle
            label="Which files"
            value={scope}
            onChange={setScope}
            className="!w-auto"
            options={[
              { value: "shared", label: `Shared · ${shared.length}` },
              { value: "private", label: `Yours · ${mine.length}` },
            ]}
          />
        </div>
        <DocumentUpload tripId={tripId} scope={scope} />
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          {scope === "shared"
            ? "Nothing shared with the trip yet — bookings and tickets go here."
            : "Nothing of your own here yet."}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-rule-soft">
          {shown.slice(0, PREVIEW).map((doc) => (
            <DocumentRow
              key={doc.id}
              tripId={tripId}
              doc={doc}
              mine={doc.uploadedBy === viewerId}
            />
          ))}
        </ul>
      )}

      {docs.length > 0 ? (
        <div className="mt-4 text-center">
          <Link
            href={`/trip/${tripId}/files`}
            className="text-sm text-pen hover:underline"
          >
            See all {docs.length} &rarr;
          </Link>
        </div>
      ) : null}
    </section>
  );
}
