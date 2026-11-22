import Link from "next/link";

import { ANALYTICS_KEEP_DAYS } from "@floc/core/analytics/events";

import { CONTACT_EMAIL, CONTRACTING_PARTY, DATA_LOCATION, PLACE_OF_BUSINESS } from "@/lib/legal/facts";
import { DATA_HELD, DATA_KEPT, DATA_RECEIVERS } from "@/lib/legal/privacy-facts";

import { LegalSection, LegalTable } from "../legal-prose";

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export function PrivacyDocument() {
  return (
    <>
      <LegalSection title="1. Introduction">
        <p>
          This Privacy policy explains how Floc (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses
          and protects personal data when you use floc.live and the Floc app. We process the information that you and
          the members of your group provide, in order to plan trips with the people on them. We do not sell personal
          data and we do not display advertising. Analytics are limited to an anonymous count of page views, recorded
          only with your consent.
        </p>
      </LegalSection>

      <LegalSection title="2. Data controller">
        <p>
          The controller of your personal data is {CONTRACTING_PARTY}, {PLACE_OF_BUSINESS}. Questions about this
          policy or about your personal data may be sent to {mail}.
        </p>
      </LegalSection>

      <LegalSection title="3. Personal data we process">
        <LegalTable head={["Data", "Purpose", "Lawful basis"]} rows={DATA_HELD.map((row) => [row.what, row.why, row.ground])} />
        <p>
          We do not receive or store your payment card number. Our system logs do not contain names, email addresses
          or trip content.
        </p>
      </LegalSection>

      <LegalSection title="4. Recipients of personal data">
        <p>
          The following service providers process personal data on our behalf, solely to operate Floc. They are not
          permitted to use it for their own purposes.
        </p>
        <LegalTable head={["Provider", "Service", "Data received"]} rows={DATA_RECEIVERS.map((row) => [row.who, row.job, row.receives])} />
        <p>
          The members of a trip can see the content added to that trip. Other users can see your profile only to the
          extent permitted by your privacy settings.
        </p>
        <p>
          A friend who keeps you in one of their groups can ask Floc for trips that fit the group. Floc uses your travel
          style to work that out and shows them only how well each trip fits the group as a whole, never what you like.
          You can turn this off on Profile, under Privacy.
        </p>
      </LegalSection>

      <LegalSection title="5. International transfers">
        <p>{DATA_LOCATION}</p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <LegalTable
          head={["Data", "Retention period"]}
          rows={[
            ...DATA_KEPT.map((row) => [row.what, row.kept]),
            ["Page-view statistics", `${Math.round(ANALYTICS_KEEP_DAYS / 30.4)} months. These contain no information that identifies you`],
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Deleting your account">
        <p>
          You may delete your account at any time from Settings, on the website or in the app. Deletion takes effect
          immediately and cannot be reversed. On deletion:
        </p>
        <ul>
          <li>your name and email address are removed from the account, and all of your sessions are ended;</li>
          <li>your private files, travel map, Google Calendar access and device push address are deleted;</li>
          <li>your friends, saved trips and packing kits are marked as deleted and are no longer shown to anyone;</li>
          <li>you are removed from every trip, and a trip of which you were the only administrator passes to another member;</li>
          <li>content you contributed to a shared trip, such as an expense or a note, is retained for the group and attributed to &ldquo;Deleted user&rdquo;, as the group&rsquo;s financial record depends on it.</li>
        </ul>
        <p>To request the removal of that shared content, or the permanent erasure of data marked as deleted, contact {mail}.</p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          Under UK data protection law, you have the right to access your personal data, to have it corrected or
          erased, to restrict or object to its processing, to receive it in a portable format, and to withdraw any
          consent you have given. To exercise these rights, contact {mail}. We will respond within one month, free of
          charge.
        </p>
        <p>
          If you are not satisfied with our response, you have the right to lodge a complaint with the Information
          Commissioner&rsquo;s Office at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Our use of cookies and similar technologies, and how to manage your preferences, are described in
          our <Link href="/cookies">Cookie policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>Floc is intended for adults. We do not knowingly process personal data relating to anyone under the age of 18.</p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. Where a change materially affects how we use your personal
          data, we will notify you by email before it takes effect.
        </p>
      </LegalSection>
    </>
  );
}
