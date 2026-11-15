import { CONTACT_EMAIL } from "@/lib/legal/facts";
import { getSession } from "@/server/access";
import { feedbackOpen } from "@/server/feedback/feedback";

import { FeedbackForm } from "../feedback-form";
import { LegalSection } from "../legal-prose";

export async function ContactDocument() {
  const session = await getSession();
  return (
    <>
      <LegalSection title="Contact us">
        <p>
          Enquiries, reports of a problem and complaints may be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We aim to respond within 10 working days.
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
