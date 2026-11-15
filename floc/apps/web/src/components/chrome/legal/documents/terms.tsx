import Link from "next/link";

import { TERMS_VERSION } from "@floc/core/legal/terms";

import { CONTACT_EMAIL, CONTRACTING_PARTY } from "@/lib/legal/facts";

import { LegalSection } from "../legal-prose";

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export function TermsDocument() {
  return (
    <>
      <LegalSection title="The short version">
        <p>
          Floc is a place to plan a trip with your group. Planning is free. Floc Pro is a paid plan for one person. We
          take no booking commission, show no ads and sell no data. These terms are the agreement between you and us.
        </p>
        <p className="font-mono text-sm text-ink-soft">Version {TERMS_VERSION}</p>
      </LegalSection>

      <LegalSection title="Who we are">
        <p>
          Floc is run by {CONTRACTING_PARTY}, in the United Kingdom. &ldquo;We&rdquo; and &ldquo;us&rdquo; mean that
          person. You can reach us at {mail}. Our details are on the <Link href="/legal">Legal</Link> page.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <ul>
          <li>You must be 18 or over to make an account.</li>
          <li>Give a real email address, and keep your password to yourself. An account is for one person.</li>
          <li>You make an account when you sign up with an email and password, or sign in with Google for the first time. By doing so you agree to these terms.</li>
          <li>A person who opens an invite link can answer as a guest with a name and no account. These terms apply to a guest too.</li>
          <li>You can delete your account at any time in Settings.</li>
        </ul>
      </LegalSection>

      <LegalSection title="What Floc does, and what it does not">
        <ul>
          <li>Floc is a planning tool. It is not a travel agent. It sells no flights, stays or tickets, and it is not a party to any booking you make.</li>
          <li>Links to booking sites are there to save you a search. We are paid nothing for them, and each site has its own terms.</li>
          <li>Weather, exchange rates, travel times and the notes in Explore are a guide. They can be out of date or wrong. Check entry rules, visas and safety advice with the official source before you travel.</li>
          <li>The Money tab records who paid and who owes who. Floc does not hold or move money. Your group settles up itself.</li>
        </ul>
      </LegalSection>

      <LegalSection title="What you add">
        <ul>
          <li>What you add to Floc stays yours. You give us permission to store it and show it to the people on your trips, which is what Floc is for.</li>
          <li>The members of a trip can see what is added to that trip. Add other people&rsquo;s details only when they would expect it.</li>
          <li>Do not add anything unlawful, or anything you have no right to share. Do not try to break Floc, get into another person&rsquo;s account or trip, or load it by script.</li>
          <li>A trip&rsquo;s admins can remove members and delete the trip. We can remove content that breaks these terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Floc Pro">
        <ul>
          <li>Pro is personal: it belongs to the account that buys it. Everything a group does together on a trip stays free.</li>
          <li>The price, and how often you pay, are shown before you pay. You pay in advance for each period.</li>
          <li>Pro renews at the end of each period until you cancel. You can cancel at any time in Settings. Pro then stays until the end of the period you paid for.</li>
          <li>If the price changes, we email you at least 30 days before your next renewal. The new price applies from that renewal, and you can cancel before it.</li>
          <li>On the website, payment is taken by Stripe. In the phone app, payment is taken by Apple or Google. We never see or hold your card number.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cancelling and refunds">
        <ul>
          <li>You have a legal right to cancel within 14 days of first buying Pro. When you buy, you ask us to start Pro at once. You keep the right to cancel, and if you use it we refund the whole payment.</li>
          <li>To cancel in those 14 days, email {mail} from your account&rsquo;s address and say so. No reason is needed. We refund to the card you paid with, within 14 days of your email.</li>
          <li>After the 14 days, and for a renewal, we do not refund part of a period. Pro stays until the period ends.</li>
          <li>If you bought Pro in the phone app, Apple or Google took the payment, and a refund comes from them under their rules.</li>
          <li>If we stop offering Pro, or close your account when you have not broken these terms, we refund the part of the period you have not used.</li>
          <li>None of this takes away your legal rights. If Pro is faulty or not as described, you may have a right to a repair, a price reduction or a refund.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Changes to Floc">
        <p>
          Floc is young and changes often. We may add, change or remove a feature. If we remove something you pay for,
          we tell you first and you can cancel for a refund of the unused part. We work to keep Floc running, but we
          do not promise that it is always available or free of faults. Keep your own copy of anything you cannot
          afford to lose, such as a ticket or a booking.
        </p>
      </LegalSection>

      <LegalSection title="Ending">
        <p>
          You can stop using Floc and delete your account at any time. We can suspend or close an account that breaks
          these terms. We tell you why, and first where we can.
        </p>
      </LegalSection>

      <LegalSection title="Our responsibility to you">
        <ul>
          <li>We are responsible for loss or damage you suffer that is a foreseeable result of our breaking these terms or not using reasonable care and skill.</li>
          <li>We are not responsible for loss that was not foreseeable, for a booking or payment you made with someone else, or for a loss to a business. Floc is for personal use.</li>
          <li>Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for your legal rights as a consumer.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Complaints and the law">
        <p>
          If something is wrong, email {mail}. We aim to reply within 10 working days. The law of England and Wales
          applies to these terms. If you live in Scotland or Northern Ireland, you can bring a claim in your own courts.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          If we change these terms in a way that matters, we email you at least 14 days before the change applies, and
          the version above changes. If you do not agree, you can delete your account and cancel Pro for a refund of
          the unused part.
        </p>
      </LegalSection>
    </>
  );
}
