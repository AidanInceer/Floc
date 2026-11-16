"use client";

import type { ReactNode } from "react";

import { AvatarRow, cx } from "@/components/system/ui";
import { PLANE_D } from "@/lib/landing/hero/flight-path";
import { FLOWN, STAMPED, TICKET_BEATS, TICKET_FIELDS, fieldFilled } from "@/lib/landing/hero/ticket-beats";

import { sampleGroup } from "../sample-trip";
import { useScene } from "../use-scene";
import { Swap } from "./swap";
import "./hero-ticket.css";

const Roomy = ({ children }: { children: ReactNode }) => <span className="max-[359px]:hidden">{children}</span>;

const FIELDS: Record<(typeof TICKET_FIELDS)[number], { label: string; value: ReactNode }> = {
  dates: { label: "Dates", value: <span className="font-mono text-sm"><Roomy>Sun </Roomy>12 – <Roomy>Sun </Roomy>19 Sep</span> },
  going: { label: "Going", value: <AvatarRow people={sampleGroup} max={6} size={18} /> },
  route: { label: "Route", value: <>4 stops<Roomy>, 7 nights</Roomy></> },
  each: { label: "Each", value: <span className="font-mono text-sm">£200.00</span> },
};

export function HeroTicket() {
  const { ref, step } = useScene<HTMLDivElement>(TICKET_BEATS);
  return (
    <div
      ref={ref}
      className={cx("ticket-trip min-[901px]:hidden", step >= FLOWN && "is-flown", step >= STAMPED && "is-stamped")}
      role="img"
      aria-label="A sample trip to Sicily: Sunday 12 to Sunday 19 September, six going, four stops over seven nights, £200.00 each, sorted"
    >
      <div className="ticket-perf">
        <svg className="ticket-plane" viewBox="0 0 24 24">
          <path d={PLANE_D} />
        </svg>
      </div>
      <div className="ticket-body px-[18px] pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-3xl leading-none tracking-[-0.035em]">Sicily</p>
          <span className="ticket-stamp rounded-sm border-2 border-green px-3 font-display text-lg text-green">Sorted</span>
        </div>
        <dl className="ticket-fields mt-3.5 grid grid-cols-[minmax(0,1fr)_auto] border-t border-rule">
          {TICKET_FIELDS.map((key, i) => (
            <div key={key}>
              <dt className="font-mono text-xs uppercase tracking-[0.08em] text-ink-3">{FIELDS[key].label}</dt>
              <dd className="mt-0.5 flex min-h-6 items-center text-base font-semibold">
                <Swap on={fieldFilled(step, i)} from={<span className="font-normal text-ink-3">Open</span>} to={FIELDS[key].value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="ticket-perf" />
    </div>
  );
}
