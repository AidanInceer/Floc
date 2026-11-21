import { Avatar, AvatarRow, cx } from "@/components/system/ui";

import { EventGlyph } from "@/components/system/icons/days";
import { NavGlyph, type NavGlyphName } from "@/components/system/icons/nav";
import { SECTION_COLOURS, type SectionColour } from "@floc/core/design/section-colours";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { alex, jo, priya, sam, sampleGroup } from "./sample-trip";

const kicker = "font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft";

const WASH: Record<SectionColour, string> = {
  blue: "bg-pastel-blue text-pastel-blue-ink",
  yellow: "bg-pastel-yellow text-pastel-yellow-ink",
  red: "bg-pastel-red text-pastel-red-ink",
  green: "bg-pastel-green text-pastel-green-ink",
};

const TABS: { key: NavGlyphName; name: string }[] = [
  { key: "dates", name: "Dates" },
  { key: "days", name: "Days" },
  { key: "money", name: "Money" },
  { key: "packing", name: "Packing" },
];

function TabBar({ active }: { active: string }) {
  return (
    <div className="mb-3 grid grid-cols-4 gap-1 border-b border-rule pb-2.5">
      {TABS.map((t) => (
        <span key={t.name} className={cx("flex flex-col items-center gap-1 rounded-sm py-1 text-[10px]", t.name === active ? "font-semibold text-ink" : "text-ink-2")}>
          <span className={cx("grid size-[22px] place-items-center rounded-sm", t.name === active ? WASH[SECTION_COLOURS[t.key] ?? "blue"] : "")}>
            <NavGlyph name={t.key} />
          </span>
          {t.name}
        </span>
      ))}
    </div>
  );
}

function TripBar() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="flex items-baseline gap-1.5 font-display text-[15px] font-semibold">
        Sicily <span className="nums text-[10px] font-normal text-ink-faint">12–19 Sep</span>
      </span>
      <AvatarRow people={sampleGroup} max={4} size={20} />
    </div>
  );
}

const EVENTS: { at: string; what: string; note: string; type: DayEventType; transport: TransportType | null; tone: string }[] = [
  { at: "10:12", what: "Train to Cefalù", note: "Palermo Centrale · 55 min", type: "transport", transport: "train", tone: "bg-pastel-red text-pastel-red-ink" },
  { at: "13:00", what: "Beach, La Spiaggia", note: "Jo brings the towels", type: "activity", transport: null, tone: "bg-pastel-blue text-pastel-blue-ink" },
  { at: "17:30", what: "Walk up La Rocca", note: "1 hour up · views of the bay", type: "activity", transport: null, tone: "bg-pastel-blue text-pastel-blue-ink" },
  { at: "20:30", what: "Ostaria del Duomo", note: "Table for 6 · booked", type: "food", transport: null, tone: "bg-pastel-yellow text-pastel-yellow-ink" },
];

export function DaysScreen() {
  return (
    <>
      <TripBar />
      <TabBar active="Days" />
      <div className="rounded-[18px] bg-pastel-green px-4 py-3.5 text-pastel-green-ink">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em]">Tue 14 Sep · Day 3 of 8</p>
        <p className="mt-1 font-display text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink">Cefalù</p>
        <p className="mt-1.5 text-[12px]">1 night · Casa sul Mare</p>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        {EVENTS.map((t) => (
          <div key={t.at} className="grid grid-cols-[30px_1fr_auto] items-center gap-2.5 rounded-[14px] border border-rule bg-sheet px-2.5 py-2 text-[13px]">
            <span className={cx("grid size-[30px] place-items-center rounded-full", t.tone)}>
              <EventGlyph type={t.type} transportType={t.transport} size={14} />
            </span>
            <span className="min-w-0">
              <b className="block truncate font-semibold">{t.what}</b>
              <small className="block truncate text-[11px] text-ink-faint">{t.note}</small>
            </span>
            <span className="nums self-start pt-0.5 text-[11px] text-ink-soft">{t.at}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const BALANCES = [
  { who: priya, amount: "+£760.00", up: true },
  { who: jo, amount: "−£62.00" },
  { who: sam, amount: "−£98.00" },
  { who: alex, amount: "−£200.00" },
];
const SPENT = [
  { what: "Dinner, Ortigia", who: jo, cost: "£138.00" },
  { what: "Car hire", who: sam, cost: "£102.00" },
];

export function MoneyScreen() {
  return (
    <>
      <TripBar />
      <TabBar active="Money" />
      <div className="rounded-[18px] bg-pen-soft px-4 py-3.5 text-pen-deep">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em]">You owe</p>
        <p className="mt-1.5 flex items-center gap-2 font-display text-[17px] font-semibold">
          <Avatar name={priya.name} tone={priya.tone} size={24} /> Priya
          <span className="nums ml-auto text-[26px] font-normal tracking-[-0.02em]">£200.00</span>
        </p>
        <span className="mt-2.5 inline-flex rounded-sm bg-pen px-3 py-[5px] font-mono text-[10px] uppercase tracking-[0.06em] text-sheet">Mark as paid</span>
      </div>
      <div className="mt-2.5 flex flex-col gap-1">
        {BALANCES.map((b) => (
          <div key={b.who.name} className="grid grid-cols-[20px_1fr_auto] items-center gap-2 rounded-[10px] bg-sheet-2 px-2.5 py-[5px] text-[12px]">
            <Avatar name={b.who.name} tone={b.who.tone} size={20} />
            <span>{b.who.name}</span>
            <span className={cx("nums", b.up ? "text-green" : "text-ink-soft")}>{b.amount}</span>
          </div>
        ))}
      </div>
      <p className={kicker + " mt-3 px-2.5"}>Latest</p>
      {SPENT.map((e) => (
        <div key={e.what} className="flex items-center gap-2 border-b border-rule px-2.5 py-1.5 text-[12px] last:border-b-0">
          <Avatar name={e.who.name} tone={e.who.tone} size={18} />
          <span className="min-w-0 flex-1 truncate">{e.what}</span>
          <span className="rounded-full bg-pastel-green px-1.5 py-px text-[10px] text-pastel-green-ink">split 6</span>
          <span className="nums">{e.cost}</span>
        </div>
      ))}
    </>
  );
}
