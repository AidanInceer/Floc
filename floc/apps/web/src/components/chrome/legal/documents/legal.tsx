import Link from "next/link";

import { ADDRESS_GAP, CONTACT_EMAIL, CONTRACTING_PARTY, POSTAL_ADDRESS } from "@/lib/legal/facts";
import { DATA_SOURCES } from "@/lib/legal/data-sources";

import { LegalSection } from "../legal-prose";

export function LegalNoticeDocument() {
  return (
    <>
      <LegalSection title="Who runs Floc">
        <p>
          Floc is run by {CONTRACTING_PARTY}, a sole trader in the United Kingdom. Floc is not a company, and it is
          not a travel agent or a tour operator.
        </p>
        <p>{POSTAL_ADDRESS ?? ADDRESS_GAP}</p>
        <p>
          Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalSection>

      <LegalSection title="Complaints">
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and say what went wrong. We aim to reply
          within 10 working days. The <Link href="/terms">Terms of use</Link> say what you can expect from us, and
          the <Link href="/privacy">Privacy policy</Link> says how to complain about your data.
        </p>
      </LegalSection>

      <LegalSection title="Credits">
        <p>Floc uses data and type made by other people. Thank you to them.</p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>What</th><th>From</th><th>Licence</th></tr>
            </thead>
            <tbody>
              {DATA_SOURCES.map((source) => (
                <tr key={source.what}>
                  <td>{source.what}</td>
                  <td><a href={source.url}>{source.from}</a></td>
                  <td>{source.licence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>
    </>
  );
}
