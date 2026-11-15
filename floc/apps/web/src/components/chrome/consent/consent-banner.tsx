"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { FULL_CONSENT, NO_CONSENT, type ConsentChoice } from "@floc/core/consent/consent";

import { Button } from "@/components/system/ui";
import { chooseConsent } from "@/lib/consent/consent-cookie";

import { ConsentChoices } from "./consent-choices";
import { useConsent } from "./use-consent";
import { useFooterRoom } from "./use-footer-room";
import "./consent-banner.css";

// Why one look for both: rejecting must be as easy as accepting (design card, consent banner).
const ANSWER = "min-w-[8rem] flex-1 py-2.5 sm:min-w-[10rem] sm:flex-none";

/**
 * Asked once, then again after a year (#368). Nothing optional is stored or counted until the person answers,
 * and every answer is given here: the Cookie policy only explains.
 */
export function ConsentBanner({ fromServer }: { fromServer: ConsentChoice | null }) {
  const consent = useConsent(fromServer);
  const [managing, setManaging] = useState(false);
  // Why: the Cookie policy holds the same switches, and the banner would sit on top of them.
  const onPolicy = usePathname() === "/cookies";
  const roomRef = useFooterRoom();
  if (consent || onPolicy) return null;
  // Why z-30: under every sheet that asks for input (the invite gate, the name sheet, a dialog), never over one.
  return (
    <section ref={roomRef} aria-labelledby="consent-title" className="consent-banner pointer-events-none fixed inset-x-0 bottom-0 z-30 p-3 sm:p-6">
      <div className="pointer-events-auto mx-auto max-h-[85vh] max-w-[58rem] overflow-y-auto rounded-md border border-rule bg-sheet p-4 shadow-lifted sm:p-7">
        <h2 id="consent-title" className="font-display text-lg text-ink">Cookie preferences</h2>
        <p className="mt-2 max-w-[48rem] text-sm leading-relaxed text-ink-2 sm:text-base">
          We use strictly necessary cookies and similar technologies to operate this website. With your consent, we
          also store your preferences on this device and record anonymous statistics on the pages visited. You may
          accept or reject all optional categories, or choose by category, and you may change your decision at any
          time. Further details are set out in our{" "}
          <Link href="/cookies" className="text-pen underline underline-offset-2 hover:text-pen-deep">Cookie policy</Link>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" className={ANSWER} onClick={() => chooseConsent(NO_CONSENT)}>Reject all</Button>
          <Button variant="primary" className={ANSWER} onClick={() => chooseConsent(FULL_CONSENT)}>Accept all</Button>
          <Button className={ANSWER} aria-expanded={managing} onClick={() => setManaging(!managing)}>
            {managing ? "Hide preferences" : "Manage preferences"}
          </Button>
        </div>
        {managing ? (
          <div className="mt-5 border-t border-rule pt-5">
            <ConsentChoices fromServer={null} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
