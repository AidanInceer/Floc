"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, ButtonLink } from "@/components/system/ui";
import { startTripHref } from "@/lib/landing/start-trip";

import { you } from "./sample-trip";

const kicker = "font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint";
const blank = "w-fit border-b-[1.5px] border-dashed border-rule-strong pb-[3px] text-ink-faint";

/** The last band: a blank ticket. The typed place rides along to the new-trip sheet on My trips. */
export function ClosingTicket({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [dest, setDest] = useState("");
  const place = dest.trim();
  const href = startTripHref(signedIn, dest);
  return (
    <section className="bg-pastel-blue px-4 pb-24 pt-24 text-center text-pastel-blue-ink sm:px-6">
      <h2 className="band-title text-ink">Where to, then?</h2>
      <div className="closing-ticket mx-auto mt-11 grid max-w-[56rem] rounded-[24px] bg-sheet text-left text-ink shadow-lifted md:grid-cols-[1fr_auto_19rem]">
        <div className="px-8 py-7">
          <span className={kicker}>Trip</span>
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(href);
            }}
            placeholder="Somewhere"
            maxLength={24}
            aria-label="Where to"
            className="mt-1 block w-full border-0 border-b-2 border-dashed border-rule-strong bg-transparent pb-1 font-display text-[clamp(2.4rem,6vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-ink outline-none placeholder:text-ink-faint/50 focus:border-pen"
          />
          <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col gap-1.5">
              <span className={kicker}>When</span>
              <b className={blank + " font-medium"}>Ask the group</b>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={kicker}>Who</span>
              <span className="flex items-center">
                <Avatar name={you.name} tone={you.tone} size={24} />
                <span className="-ml-1.5 inline-flex size-6 items-center justify-center rounded-full border border-dashed border-rule-strong bg-sheet text-[13px] text-ink-faint">
                  +
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={kicker}>Route</span>
              <b className={blank + " font-medium"}>Draw it together</b>
            </div>
          </div>
        </div>
        <div className="closing-perf" />
        <div className="flex flex-col items-start justify-center gap-3.5 px-6 py-7">
          <span className={kicker}>Admit the group</span>
          <ButtonLink href={href} variant="primary" className="whitespace-nowrap px-6 py-3 text-[12px]">
            {place ? `Start ${place} — free` : "Start this trip — free"}
          </ButtonLink>
          <span className="nums text-[13px] text-ink-faint">Free for the whole group</span>
        </div>
      </div>
    </section>
  );
}
