import type { CSSProperties, ReactNode } from "react";

import { Avatar, cx } from "@/components/system/ui";
import type { MarkBeat } from "@/lib/landing/agent/agent-timeline";

import { Swap } from "../hero/swap";
import { Glyph } from "../landing-glyph";
import { sam, sampleStops } from "../sample-trip";

// Illustrative sample, not a live query — what Floc made of each ask in Priya's brief.
const WEEK = [["S", 12, 27], ["M", 13, 28], ["T", 14, 26], ["W", 15, 25], ["T", 16, 14], ["F", 17, 26], ["S", 18, 26], ["S", 19, 25]] as const;
const STAYS = [
  ["Flat in the Kalsa", "Palermo · 2 nights"],
  ["Hotel Kalura, on the beach", "Cefalù · 1 night"],
  ["Flat off Corso Umberto", "Taormina · 2 nights"],
  ["Flat on Ortigia", "Syracuse · 2 nights"],
] as const;
const PACK = [
  ["Light jumper", "14° at the top of Etna"],
  ["Boots", "the lava sand is sharp"],
  ["Swimsuits", "the sea is 25°"],
  ["Cover-up", "for Cefalù cathedral"],
] as const;
const EAT = [
  ["Arancine, Ballarò market", "Palermo · go before 11"],
  ["Da Nino", "Cefalù · 4 min walk"],
  ["Granita and brioche", "Taormina · breakfast"],
  ["Pasta alla Norma", "Etna · on the way down"],
] as const;
const SPEND = [["Stays", "£474"], ["Etna jeep tour", "£65"], ["Trains and a bus", "£22"], ["Food, about", "£300"]] as const;

const order = (i: number) => ({ "--i": i }) as CSSProperties;
const label = "typed text-inherit opacity-85";

function Head({ children }: { children: ReactNode }) {
  return <header className="flex min-h-5 items-center gap-2 [&>:last-child:not(:first-child)]:ml-auto">{children}</header>;
}

function Tick() {
  return (
    <i className="agent-tick grid size-[15px] shrink-0 place-items-center rounded-full border-[1.2px] border-current">
      <Glyph name="check" className="size-2.5" />
    </i>
  );
}

function WhenCard({ run }: { run: boolean }) {
  return (
    <>
      <Head>
        <span className={label}>12–19 Sep</span>
        <Swap on={run} className="text-xs font-semibold" from="4 of 6 free" to={<span className="inline-flex items-center gap-1"><Glyph name="check" className="size-3" />All 6 free</span>} />
      </Head>
      <ol className="grid grid-cols-8 gap-1">
        {WEEK.map(([d, n, temp], i) => (
          <li key={n} style={order(i)} className="agent-day grid justify-items-center gap-px rounded-[9px] bg-[var(--vignette)] pb-1.5 pt-[5px] text-[11px]">
            <b className="text-[10px] font-medium opacity-65">{d}</b>
            <span className="nums text-[13px] font-semibold">{n}</span>
            <em className="agent-temp nums font-mono text-[10px] not-italic">{temp}°</em>
          </li>
        ))}
      </ol>
      <p className="mt-auto text-[12.5px] leading-[1.4]">Best week for it: sea at 25°, the August crowds gone. Etna is the cold day.</p>
    </>
  );
}

function RouteCard({ run }: { run: boolean }) {
  return (
    <>
      <Head>
        <span className={label}>Route · 7 nights</span>
      </Head>
      <ol className={cx("deck-route relative grid grid-cols-4", run && "is-drawn")}>
        {sampleStops.map((s, i) => (
          <li key={s.name} className="deck-stop text-center text-[12.5px]" style={{ "--delay": `${0.15 + i * 0.3}s` } as CSSProperties}>
            <i className="mx-auto mb-1.5 block size-[13px] rounded-full border-2 border-sheet bg-pen shadow-[0_0_0_1.5px_var(--pen)]" />
            {s.name}
            <span className="nums block text-[10px] text-ink-faint">
              {s.days} {s.days === 1 ? "night" : "nights"}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-[12.5px] leading-[1.4] text-ink-soft">In at Palermo, home from Catania: no drive back.</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-rule-strong pt-2.5 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Glyph name="flight" className="text-pen" />
          <b className="font-medium text-ink">LGW → PMO</b> · <b className="font-medium text-ink">CTA → LGW</b>
        </span>
        <span className="agent-book rounded-full bg-pen px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] whitespace-nowrap text-sheet">Book flights</span>
      </div>
    </>
  );
}

function StaysCard() {
  return (
    <>
      <Head>
        <span className={label}>Stays</span>
        <span className="nums text-xs text-ink-faint">£2,844</span>
      </Head>
      <ul className="agent-stays grid gap-[7px]">
        {STAYS.map(([name, where]) => (
          <li key={name} className="grid grid-cols-[14px_1fr] items-center gap-[9px] text-[12.5px] leading-tight">
            <Glyph name="stay" className="text-ink-faint" />
            <span>
              <b className="block font-medium">{name}</b>
              <em className="block font-mono text-[10px] not-italic text-ink-faint">{where}</em>
            </span>
          </li>
        ))}
      </ul>
      <span className="deck-settled agent-booked top-[60%]">
        <span className="deck-tick">
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path pathLength={1} d="M2.6 7.4 5.6 10.4 11.4 4" />
          </svg>
        </span>
        All 4 booked
      </span>
    </>
  );
}

function PackCard() {
  return (
    <>
      <Head>
        <span className={label}>Packing · from the forecast</span>
      </Head>
      <ul className="grid gap-1.5">
        {PACK.map(([thing, why], i) => (
          <li key={thing} style={order(i)} className="flex items-center gap-2 whitespace-nowrap text-[12.5px]">
            <Tick />
            <b className="font-medium">{thing}</b>
            <em className="truncate text-[11.5px] not-italic opacity-80">{why}</em>
          </li>
        ))}
        <li style={order(PACK.length)} className="flex items-center gap-2 whitespace-nowrap text-[12.5px]">
          <Tick />
          <b className="font-medium">First-aid kit</b>
          <em className="truncate text-[11.5px] not-italic opacity-80">one for all six</em>
          <span className="ml-auto">
            <Avatar name={sam.name} tone={sam.tone} size={20} />
          </span>
        </li>
      </ul>
    </>
  );
}

function EatCard() {
  return (
    <>
      <Head>
        <span className={label}>Near where you sleep</span>
      </Head>
      <ul className="grid gap-1.5">
        {EAT.map(([spot, where], i) => (
          <li key={spot} style={order(i)} className="agent-eat grid grid-cols-[14px_1fr_auto] items-baseline gap-2 text-[12.5px]">
            <Glyph name="pin" className="self-center" />
            <b className="font-medium">{spot}</b>
            <em className="text-right font-mono text-[10px] not-italic opacity-85">{where}</em>
          </li>
        ))}
      </ul>
    </>
  );
}

function MoneyCard({ run }: { run: boolean }) {
  return (
    <>
      <Head>
        <span className={label}>Each, before flights</span>
        <span className="agent-under inline-flex items-center gap-1 rounded-full border border-green-edge bg-sheet py-0.5 pl-1.5 pr-2.5 text-[11.5px] font-semibold text-green">
          <Glyph name="check" className="size-[11px]" />
          £39 under
        </span>
      </Head>
      <p className="nums mt-0.5 font-display text-[44px] font-semibold leading-none tracking-[-0.035em]">
        <Swap on={run} className="agent-fig" from="£900" to="£861" />
      </p>
      <ul className="mt-auto grid grid-cols-2 gap-x-3.5 gap-y-1 text-[11.5px]">
        {SPEND.map(([what, each], i) => (
          <li key={what} style={order(i)} className="agent-spend flex justify-between gap-1.5">
            <span>{what}</span>
            <b className="nums font-semibold">{each}</b>
          </li>
        ))}
      </ul>
    </>
  );
}

const CARDS: Record<number, { skin: string; body: (run: boolean) => ReactNode }> = {
  1: { skin: "bg-pastel-blue text-pastel-blue-ink", body: (run) => <WhenCard run={run} /> },
  2: { skin: "border border-rule bg-sheet text-ink", body: (run) => <RouteCard run={run} /> },
  3: { skin: "border border-rule bg-sheet text-ink", body: () => <StaysCard /> },
  4: { skin: "bg-pastel-red text-pastel-red-ink", body: () => <PackCard /> },
  5: { skin: "bg-pastel-yellow text-pastel-yellow-ink", body: () => <EatCard /> },
  6: { skin: "bg-pastel-green text-pastel-green-ink", body: (run) => <MoneyCard run={run} /> },
};

function Slot({ beat, t }: { beat: MarkBeat; t: number }) {
  const card = CARDS[beat.mark]!;
  const run = t >= beat.runAt;
  return (
    <div data-card={beat.mark} data-far={beat.far ? "" : undefined}>
      <article className={cx("agent-card relative flex h-[188px] flex-col gap-2.5 overflow-hidden rounded-[18px] px-4 py-3.5 shadow-raised", card.skin, t >= beat.inAt && "is-in", run && "is-run")}>
        {card.body(run)}
      </article>
    </div>
  );
}

/** What each ask became, in two staggered columns so a line to the far column runs through a gap in the near one. */
export function AgentCards({ marks, t }: { marks: MarkBeat[]; t: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-7 pl-[104px]">
      <div data-near className="flex flex-col gap-6">
        {marks.filter((m) => !m.far).map((m) => <Slot key={m.mark} beat={m} t={t} />)}
      </div>
      {/* Half a card down, so each far card faces the gap between two near ones. */}
      <div className="flex flex-col gap-6 pt-[106px]">
        {marks.filter((m) => m.far).map((m) => <Slot key={m.mark} beat={m} t={t} />)}
      </div>
    </div>
  );
}
