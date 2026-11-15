"use server";

import { FEEDBACK_PROBLEMS } from "@floc/core/feedback/feedback";

import pkg from "../../../package.json" with { type: "json" };

import { getSession } from "@/server/access";
import { sendFeedback } from "@/server/feedback/feedback";

export type FeedbackState = { sent?: boolean; error?: string };

/** Feedback from the Contact page (#271). The form keeps its words unless this says `sent`. */
export async function submitFeedback(_previous: FeedbackState, form: FormData): Promise<FeedbackState> {
  const session = await getSession();
  if (!session?.user) return { error: "Sign in to send feedback." };
  const { id, name, email } = session.user;
  const result = await sendFeedback(
    { id, name, email },
    { message: form.get("message"), page: form.get("page"), surface: "web", appVersion: pkg.version },
  );
  return result === "sent" ? { sent: true } : { error: FEEDBACK_PROBLEMS[result] };
}
