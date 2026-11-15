import Link from "next/link";

import { TERMS_VERSION } from "@floc/core/legal/terms";

import { CONTACT_EMAIL, CONTRACTING_PARTY, PLACE_OF_BUSINESS } from "@/lib/legal/facts";

import { LegalSection } from "../legal-prose";

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export function TermsDocument() {
  return (
    <>
      <LegalSection title="1. Introduction">
        <p>
          These Terms of use (the &ldquo;Terms&rdquo;) form the agreement between you and us for the use of Floc, a
          service for planning trips with a group. Trip planning is free of charge. Floc Pro is a paid plan for an
          individual account. We charge no booking commission, display no advertising and do not sell personal data.
        </p>
        <p className="font-mono text-sm text-ink-soft">Version {TERMS_VERSION}</p>
      </LegalSection>

      <LegalSection title="2. About us">
        <p>
          Floc is operated by {CONTRACTING_PARTY}, {PLACE_OF_BUSINESS} (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;). You may contact us at {mail}. Further details are given in
          the <Link href="/legal">Legal notice</Link>.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <ol>
          <li>You must be at least 18 years of age to create an account.</li>
          <li>You must provide a valid email address and keep your password confidential. Each account is for the use of one person only.</li>
          <li>An account is created when you register with an email address and password, or when you first sign in with Google. By creating an account, you accept these Terms.</li>
          <li>A person who opens an invitation link may respond as a guest, giving a name and without creating an account. These Terms also apply to guests.</li>
          <li>You may delete your account at any time from Settings.</li>
        </ol>
      </LegalSection>

      <LegalSection title="4. The service">
        <ol>
          <li>Floc is a planning tool. It is not a travel agent or tour operator, it does not sell flights, accommodation or tickets, and it is not a party to any booking you make.</li>
          <li>Links to booking websites are provided for convenience only. We receive no payment for them, and each website is subject to its own terms.</li>
          <li>Weather forecasts, exchange rates, travel times and Explore content are provided for guidance only and may be inaccurate or out of date. You should verify entry requirements, visa rules and travel advice with the official source before travelling.</li>
          <li>The Money tab records payments and balances between members. Floc does not hold or transfer money. Members are responsible for settling balances between themselves.</li>
        </ol>
      </LegalSection>

      <LegalSection title="5. Your content">
        <ol>
          <li>You retain ownership of the content you add to Floc. You grant us a licence to store that content and display it to the members of your trips, for the purpose of providing the service.</li>
          <li>Content added to a trip is visible to all members of that trip. You should add personal details of other people only where they would reasonably expect it.</li>
          <li>You must not add unlawful content or content you have no right to share. You must not attempt to disrupt the service, access another person&rsquo;s account or trip, or access the service by automated means.</li>
          <li>Trip administrators may remove members and delete the trip. We may remove content that breaches these Terms.</li>
        </ol>
      </LegalSection>

      <LegalSection title="6. Floc Pro">
        <ol>
          <li>Floc Pro is personal to the account that purchases it. All shared group features on a trip remain free of charge.</li>
          <li>The price and billing period are shown before you pay. Payment is taken in advance for each billing period.</li>
          <li>Floc Pro renews automatically at the end of each billing period until cancelled. You may cancel at any time in Settings, and Floc Pro remains active until the end of the period already paid for.</li>
          <li>We will notify you by email of any price change at least 30 days before your next renewal. The new price applies from that renewal, and you may cancel before it takes effect.</li>
          <li>On the website, payment is processed by Stripe. In the app, payment is processed by Apple or Google. We do not receive or store your card number.</li>
        </ol>
      </LegalSection>

      <LegalSection title="7. Cancellation and refunds">
        <ol>
          <li>You have a statutory right to cancel within 14 days of first purchasing Floc Pro. At purchase, you request that Floc Pro begins immediately. You retain the right to cancel, and if you exercise it we will refund the full payment.</li>
          <li>To cancel within this period, email {mail} from the address registered to your account. No reason is required. We will refund the payment to the original card within 14 days of receiving your email.</li>
          <li>After the 14-day period, and for any renewal, we do not refund part of a billing period. Floc Pro remains active until the period ends.</li>
          <li>Where Floc Pro was purchased in the app, payment was taken by Apple or Google, and any refund is issued by them under their own terms.</li>
          <li>If we withdraw Floc Pro, or close your account where you have not breached these Terms, we will refund the unused part of the billing period.</li>
          <li>Nothing in these Terms affects your statutory rights. If Floc Pro is faulty or not as described, you may be entitled to a repair, a price reduction or a refund.</li>
        </ol>
      </LegalSection>

      <LegalSection title="8. Changes to the service">
        <p>
          Floc is under active development. We may add, change or withdraw features. Where we withdraw a feature you
          have paid for, we will notify you in advance and you may cancel for a refund of the unused part of the
          billing period. We take reasonable steps to keep Floc available, but we do not guarantee that it will be
          available at all times or free from faults. You should keep your own copies of essential documents, such as
          tickets and booking confirmations.
        </p>
      </LegalSection>

      <LegalSection title="9. Suspension and termination">
        <p>
          You may stop using Floc and delete your account at any time. We may suspend or close an account that
          breaches these Terms. We will give our reasons and, where reasonably possible, notify you in advance.
        </p>
      </LegalSection>

      <LegalSection title="10. Liability">
        <ol>
          <li>We are responsible for loss or damage you suffer that is a foreseeable result of our breach of these Terms or our failure to use reasonable care and skill.</li>
          <li>We are not responsible for loss that was not foreseeable, for any booking or payment you make with a third party, or for any business loss. Floc is provided for personal use only.</li>
          <li>Nothing in these Terms limits our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any matter that cannot be limited under consumer law.</li>
        </ol>
      </LegalSection>

      <LegalSection title="11. Complaints and governing law">
        <p>
          Complaints may be sent to {mail}. We aim to respond within 10 working days. These Terms are governed by the
          law of England and Wales. If you live in Scotland or Northern Ireland, you may also bring proceedings in the
          courts of your country of residence.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to these Terms">
        <p>
          Where we make a material change to these Terms, we will notify you by email at least 14 days before it takes
          effect, and the version number above will change. If you do not accept the change, you may delete your
          account and cancel Floc Pro for a refund of the unused part of the billing period.
        </p>
      </LegalSection>
    </>
  );
}
