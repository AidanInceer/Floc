"use client";

import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";

import { FEEDBACK_SENT } from "@floc/core/feedback/feedback";
import { TEXT_CAPS } from "@floc/core/text/text";

import { submitFeedback, type FeedbackState } from "@/app/contact/actions";
import { SubmitButton } from "@/components/system/client-ui";
import { ErrorText, Textarea } from "@/components/system/ui";
import { lastPage } from "@/lib/chrome/page-trail";

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
      <Textarea name="message" aria-label="Feedback" maxLength={TEXT_CAPS.feedback} value={message}
        onChange={(event) => setMessage(event.target.value)} className="min-h-28" />
      <ErrorText>{state.error}</ErrorText>
      <div className="flex items-center gap-3">
        <SubmitButton disabled={!message.trim()}>Send</SubmitButton>
        {state.sent && !message ? <p role="status" className="text-sm text-ink-soft">{FEEDBACK_SENT}</p> : null}
      </div>
    </form>
  );
}
