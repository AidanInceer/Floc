"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FULL_CONSENT, NO_CONSENT, type ConsentChoice } from "@floc/core/consent/consent";

import { Button } from "@/components/system/ui";
import { chooseConsent } from "@/lib/consent/consent-cookie";

import { useConsent } from "./use-consent";
import "./consent-banner.css";

/**
 * Asked once, then again after a year (#368). Why both buttons are the same: a yes must not be easier than a no.
 * Nothing optional is stored or counted until one of them is pressed.
 */
export function ConsentBanner({ fromServer }: { fromServer: ConsentChoice | null }) {
  const consent = useConsent(fromServer);
  // Why: the Cookies page holds the same choice as switches, and the banner would sit on top of them.
  const onChoicesPage = usePathname() === "/cookies";
  if (consent || onChoicesPage) return null;
  // Why z-30: under every sheet that asks for input (the invite gate, the name sheet, a dialog), never over one.
  return (
    <section aria-label="Cookie choices" className="consent-banner pointer-events-none fixed inset-x-0 bottom-0 z-30 p-3 sm:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-[46rem] flex-wrap items-center justify-end gap-x-5 gap-y-3 rounded-md border border-rule bg-sheet p-4 shadow-lifted">
        <p className="min-w-[15rem] flex-1 text-sm text-ink">
          Floc stores what it needs to work. With your yes, it also remembers small choices on this device and counts
          page views, with no cookie and nothing that names you.{" "}
          <Link href="/cookies" className="whitespace-nowrap text-pen underline underline-offset-2 hover:text-pen-deep">Choose each one</Link>
        </p>
        <div className="flex gap-2">
          <Button onClick={() => chooseConsent(NO_CONSENT)}>Reject</Button>
          <Button onClick={() => chooseConsent(FULL_CONSENT)}>Accept</Button>
        </div>
      </div>
    </section>
  );
}
