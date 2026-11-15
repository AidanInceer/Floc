import Link from "next/link";

import { CONTACT_EMAIL, CONTRACTING_PARTY, PLACE_OF_BUSINESS } from "@/lib/legal/facts";
import { DATA_SOURCES } from "@/lib/legal/data-sources";

import { LegalSection, LegalTable } from "../legal-prose";

export function LegalNoticeDocument() {
  return (
    <>
      <LegalSection title="1. Service provider">
        <p>
          Floc is operated by {CONTRACTING_PARTY}, a sole trader established in the United Kingdom. Floc is not a
          registered company. Floc is not a travel agent or a tour operator.
        </p>
        <p>
          Place of business: {PLACE_OF_BUSINESS}
          <br />
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalSection>

      <LegalSection title="2. Complaints">
        <p>
          Complaints may be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, with a description of
          the matter. We aim to respond within 10 working days. Our obligations to you are set out in
          the <Link href="/terms">Terms of use</Link>. The <Link href="/privacy">Privacy policy</Link> explains how to
          raise a complaint about the use of your personal data.
        </p>
      </LegalSection>

      <LegalSection title="3. Third-party data and attributions">
        <p>Floc uses the following data and typefaces under the licences shown.</p>
        <LegalTable
          head={["Material", "Source", "Licence"]}
          rows={DATA_SOURCES.map((source) => [source.what, <a key="from" href={source.url}>{source.from}</a>, source.licence])}
        />
      </LegalSection>
    </>
  );
}
