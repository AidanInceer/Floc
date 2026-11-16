import Link from "next/link";

import { ConsentChoices } from "@/components/chrome/consent/consent-choices";
import { CONTACT_EMAIL } from "@/lib/legal/facts";
import { STORAGE_CATEGORIES } from "@/lib/legal/storage-list";
import { getSession } from "@/server/access";
import { requestConsent } from "@/server/consent/consent";

import { LegalSection, LegalTable } from "../legal-prose";

export async function CookiesDocument() {
  const [consent, session] = await Promise.all([requestConsent(), getSession()]);
  return (
    <>
      <LegalSection title="1. About this policy">
        <p>
          This Cookie policy explains how Floc (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) uses cookies and
          similar technologies, such as local storage, session storage and browser databases, on floc.live and in the
          Floc app. It should be read together with our <Link href="/privacy">Privacy policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="2. Categories we use">
        <p>
          We group the technologies we use into the three categories below. Strictly necessary technologies are used
          without consent, as the law permits. Every other category is used only with your consent.
        </p>
        <LegalTable
          head={["Category", "Purpose", "What it includes", "Duration", "Consent"]}
          short={["Consent"]}
          rows={STORAGE_CATEGORIES.map((row) => [row.label, row.detail, row.examples, row.duration, row.consent])}
        />
      </LegalSection>

      <LegalSection title="3. Third-party and advertising cookies">
        <p>
          We do not use advertising cookies, and we do not permit any third party to set cookies through our website.
          When you choose to sign in with Google, Google may set its own cookies on its own website, under its own
          policy.
        </p>
      </LegalSection>

      <LegalSection title="4. Managing your preferences">
        {session?.user ? (
          <p>
            You may give, change or withdraw your consent at any time under{" "}
            <Link href="/profile?section=data#settings-data">Your data</Link> on your profile. Your decision is
            recorded for 12 months, after which we ask again. Withdrawing consent removes the preference data stored
            on this device.
          </p>
        ) : (
          <>
            <p>
              You may give, change or withdraw your consent at any time below. Your decision is recorded for 12
              months, after which we ask again. Withdrawing consent removes the preference data stored on this device.
            </p>
            <ConsentChoices fromServer={consent} />
          </>
        )}
        <p>
          You may also block or delete cookies in your browser settings. If you block strictly necessary cookies, you
          will not be able to sign in.
        </p>
      </LegalSection>

      <LegalSection title="5. Changes and contact">
        <p>
          We will update this policy if the technologies we use change. Questions about this policy may be sent
          to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </>
  );
}
