import Link from "next/link";

import { ANALYTICS_KEEP_DAYS } from "@floc/core/analytics/events";

import { CONTACT_EMAIL, CONTRACTING_PARTY, DATA_LOCATION, LOCATION_GAP } from "@/lib/legal/facts";
import { DATA_HELD, DATA_KEPT, DATA_RECEIVERS } from "@/lib/legal/privacy-facts";

import { LegalSection } from "../legal-prose";

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export function PrivacyDocument() {
  return (
    <>
      <LegalSection title="The short version">
        <p>
          Floc holds what you and your group put into it, so it can show your trip to the people on it. We sell no
          data and show no ads. The only tracking is our own count of page views, and only if you say yes.
        </p>
      </LegalSection>

      <LegalSection title="Who is responsible">
        <p>
          {CONTRACTING_PARTY}, in the United Kingdom, decides how your data is used (the &ldquo;controller&rdquo;).
          Write to {mail} about anything on this page.
        </p>
      </LegalSection>

      <LegalSection title="What we hold, and why">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>What</th><th>Why</th><th>Legal ground</th></tr>
            </thead>
            <tbody>
              {DATA_HELD.map((row) => (
                <tr key={row.what}><td>{row.what}</td><td>{row.why}</td><td>{row.ground}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>We never see or hold your card number. Our logs hold no names, emails or trip content.</p>
      </LegalSection>

      <LegalSection title="Who else receives it">
        <p>These companies handle data for us, only to run Floc. None of them may use it for their own purposes.</p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>Company</th><th>What for</th><th>What it receives</th></tr>
            </thead>
            <tbody>
              {DATA_RECEIVERS.map((row) => (
                <tr key={row.who}><td>{row.who}</td><td>{row.job}</td><td>{row.receives}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>The people on a trip see what is added to that trip. Your profile shows other people only what your privacy settings allow.</p>
        <p>{DATA_LOCATION ?? LOCATION_GAP}</p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>What</th><th>How long</th></tr>
            </thead>
            <tbody>
              {DATA_KEPT.map((row) => (
                <tr key={row.what}><td>{row.what}</td><td>{row.kept}</td></tr>
              ))}
              <tr><td>Page-view counts</td><td>{Math.round(ANALYTICS_KEEP_DAYS / 30.4)} months. They hold nothing that names you.</td></tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="Deleting your account">
        <p>
          Settings, then Delete account, on the website or in the app. It happens at once and cannot be undone.
        </p>
        <ul>
          <li>Your name and email are removed from the account, and you are signed out everywhere.</li>
          <li>Your private files, your travel map, your Google Calendar access and your phone&rsquo;s push address are deleted.</li>
          <li>Your friends, saved trips and packing kits are marked as deleted and are no longer shown to anyone.</li>
          <li>You leave every trip. A trip you were the only admin of passes to another member.</li>
          <li>What you added to a shared trip, such as an expense or a note, stays for the group and shows as &ldquo;Deleted user&rdquo;. A group&rsquo;s record of who paid would break without it.</li>
        </ul>
        <p>To have that shared content removed, or anything marked as deleted erased for good, email {mail}.</p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can ask for a copy of your data, ask us to correct or delete it, ask us to stop or limit a use of it,
          and take back a consent you gave. Email {mail}. We answer within one month. It costs nothing.
        </p>
        <p>
          If you are not happy with our answer, you can complain to the Information Commissioner&rsquo;s Office
          at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.
        </p>
      </LegalSection>

      <LegalSection title="Cookies, and children">
        <p>
          What Floc stores on your device, and your choices, are on the <Link href="/cookies">Cookies</Link> page.
          Floc is for adults. We do not knowingly hold data about anyone under 18.
        </p>
      </LegalSection>
    </>
  );
}
