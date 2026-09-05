"use client";

/*
 * The Add/Edit event form's type picker (ticket 74).
 *
 * Client-only for one reason: "how are we getting there" is a question that
 * only exists once the answer to "what is this" is Transport. The old form
 * showed the transport dropdown to everyone with a "only used when kind is
 * Transport" hint underneath — an instruction doing a control's job. The
 * select's value has to be read in the browser for the field to appear and
 * disappear, so this pair lives together in one client component while the
 * rest of the form stays server-rendered.
 *
 * Unmounting rather than hiding is deliberate: an unmounted input submits
 * nothing, so switching away from Transport can't leave a stale
 * `transportType` in the FormData. The server action nulls it for non-transport
 * anyway — this is the second lock, not the only one.
 */

import { useState } from "react";

import { Field, Select } from "@/components/ui";
import { EVENT_CATEGORIES } from "@floc/core/event-categories";
import type { DayEventType, TransportType } from "@/db/schema";

const TRANSPORT_LABELS: Record<TransportType, string> = {
  flight: "Flight",
  train: "Train",
  car: "Car",
  ferry: "Ferry",
  other: "Other",
};

export function EventTypeFields({
  defaultType,
  defaultTransportType,
}: {
  defaultType: DayEventType;
  defaultTransportType?: TransportType | null;
}) {
  const [type, setType] = useState<DayEventType>(defaultType);

  return (
    <>
      <Field label="Event type">
        {/* Driven off EVENT_CATEGORIES so a new category can't be invented
            here without a colour, or given one nothing offers (ticket 68). */}
        <Select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as DayEventType)}
        >
          {Object.entries(EVENT_CATEGORIES).map(([value, c]) => (
            <option key={value} value={value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      {type === "transport" ? (
        <Field label="How">
          <Select name="transportType" defaultValue={defaultTransportType ?? ""}>
            <option value="">—</option>
            {Object.entries(TRANSPORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </>
  );
}
