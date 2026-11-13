"use client";

/**
 * From a booking file to the plan (#559). A Travel file becomes a transport event; a Hotel file goes on
 * the first night of its stay. The form starts with what Floc read from the booking, and nothing reaches
 * Days until its member presses the button (ADR-027).
 */
import { addFileToDays } from "@/app/trip/[id]/files/actions";
import { HOW_LABELS } from "@/components/days/event-sheet/event-type-tiles";
import { ActionForm, Sheet, SubmitButton, useSheetClose } from "@/components/system/client-ui";
import { Field, Input, Select, SheetFooter, menuItemClass, panelFieldClass } from "@/components/system/ui";
import { flightTitle, type BookingDetails, type FlightDetails } from "@floc/core/documents/booking/booking-details";
import { formatDate } from "@floc/core/dates/dates";
import { TRANSPORT_TYPES } from "@floc/core/vocabulary";

export type DayChoice = { id: number; date: string };

type Props = {
  tripId: number;
  documentId: number;
  kind: "travel" | "hotel";
  name: string;
  days: DayChoice[];
  /** What Floc read, for a Pro member. Null leaves the form to the member. */
  booking: BookingDetails | null;
};

export function AddToDays(props: Props) {
  return (
    <Sheet bareTrigger trigger="Add to Days" title="Add to Days" triggerClassName={menuItemClass} body="flush" keepOpenOnSubmit>
      <AddToDaysForm {...props} />
    </Sheet>
  );
}

function AddToDaysForm({ tripId, documentId, kind, name, days, booking }: Props) {
  const close = useSheetClose();
  const add = async (formData: FormData) => {
    const answer = await addFileToDays(tripId, documentId, formData);
    if (!answer?.error) close?.();
    return answer;
  };
  const flight = booking?.kind === "flight" ? booking : null;
  const stay = booking?.kind === "hotel" ? booking : null;
  const date = flight?.date ?? stay?.checkIn ?? null;
  const dayId = days.find((day) => day.date === date)?.id ?? days[0]?.id;

  return (
    <ActionForm action={add} keepAnswers errorClassName="px-4 pb-3" footer={<SheetFooter><SubmitButton variant="primary">Add to Days</SubmitButton></SheetFooter>}>
      <input type="hidden" name="kind" value={kind} />
      <div className="grid gap-4 px-4 py-4 min-[480px]:grid-cols-2">
        <Field label={kind === "hotel" ? "First night" : "Day"} className="min-[480px]:col-span-2">
          <Select name="dayId" defaultValue={dayId} required>
            {days.map((day) => (
              <option key={day.id} value={day.id}>
                {formatDate(day.date)}
              </option>
            ))}
          </Select>
        </Field>
        {kind === "travel" ? <TravelFields name={name} flight={flight} /> : null}
      </div>
    </ActionForm>
  );
}

function TravelFields({ name, flight }: { name: string; flight: FlightDetails | null }) {
  return (
    <>
      <Field label="Name" className="min-[480px]:col-span-2">
        <input name="title" required maxLength={120} defaultValue={flight ? flightTitle(flight) : name.replace(/\.[a-z0-9]+$/i, "")} className={panelFieldClass} />
      </Field>
      <Field label="How">
        <Select name="transportType" defaultValue={flight ? "flight" : ""}>
          <option value="">Not set</option>
          {TRANSPORT_TYPES.map((how) => (
            <option key={how} value={how}>
              {HOW_LABELS[how]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Leaves">
          <Input type="time" name="time" step={60} defaultValue={flight?.departTime ?? ""} />
        </Field>
        <Field label="Arrives">
          <Input type="time" name="endTime" step={60} defaultValue={flight?.arriveTime ?? ""} />
        </Field>
      </div>
    </>
  );
}
