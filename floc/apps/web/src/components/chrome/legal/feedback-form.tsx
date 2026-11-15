"use client";

import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";

import { FEEDBACK_SENT } from "@floc/core/feedback/feedback";
import { TEXT_CAPS } from "@floc/core/text/text";

import { submitFeedback, type FeedbackState } from "@/app/contact/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { ErrorText, cx, panelFieldClass } from "@/components/system/ui";
import { lastPage } from "@/lib/chrome/page-trail";

/** Why the words are state (#271): React empties a form after its action, and a failed send must keep what was typed. */
export function FeedbackForm() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [state, send] = useActionState(async (previous: FeedbackState, form: FormData): Promise<FeedbackState> => {
    form.set("page", lastPage(pathname));
    const next = await submitFeedback(previous, form);
    if (next.sent) setMessage("");
    return next;
  }, {});

  return (
    <form action={send} className="flex flex-col items-start gap-3">
      <textarea name="message" aria-label="Feedback" required maxLength={TEXT_CAPS.feedback} value={message}
        onChange={(event) => setMessage(event.target.value)} className={cx(panelFieldClass, "min-h-28")} />
      <ErrorText>{state.error}</ErrorText>
      <div className="flex items-center gap-3">
        <SubmitButton>Send</SubmitButton>
        {state.sent && !message ? <p role="status" className="text-sm text-ink-soft">{FEEDBACK_SENT}</p> : null}
      </div>
    </form>
  );
}
