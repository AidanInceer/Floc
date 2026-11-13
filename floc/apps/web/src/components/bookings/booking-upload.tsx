"use client";

/** Upload straight to Bookings (#559): one file, no questions — its trip is chosen on the row it lands on. */
import { useRef } from "react";

import { uploadBooking } from "@/app/bookings/actions";
import { ActionForm, useFormPending } from "@/components/system/client-ui";
import { UploadIcon } from "@/components/system/icons";
import { busyMark, buttonClass } from "@/components/system/ui";
import { DOCUMENT_ACCEPT } from "@floc/core/documents/documents";

export function BookingUpload() {
  return (
    <ActionForm action={uploadBooking} className="flex flex-col items-end gap-1" errorClassName="">
      <UploadButton />
    </ActionForm>
  );
}

function UploadButton() {
  const input = useRef<HTMLInputElement>(null);
  const pending = useFormPending();
  return (
    <>
      <input
        ref={input}
        type="file"
        name="file"
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => { if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit(); }}
      />
      <button type="button" disabled={pending} onClick={() => input.current?.click()} className={buttonClass("primary")}>
        <UploadIcon />
        Upload{busyMark(pending)}
      </button>
    </>
  );
}
