import { CONTACT_EMAIL } from "@/lib/legal/facts";
import { getSession } from "@/server/access";
import { feedbackOpen } from "@/server/feedback/feedback";

import { FeedbackForm } from "../feedback-form";
import { LegalSection } from "../legal-prose";

export async function ContactDocument() {
  const session = await getSession();
  return (
    <>
      <LegalSection title="Write to us">
        <p>
          For a question, a problem or a complaint, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
      {session?.user && feedbackOpen() ? (
        <LegalSection title="Feedback">
          <FeedbackForm />
        </LegalSection>
      ) : null}
    </>
  );
}
