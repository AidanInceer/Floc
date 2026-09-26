import { Avatar, AvatarRow, cx } from "@/components/system/ui";

import { Glyph, type GlyphName } from "./landing-glyph";
import { alex, jo, priya, sam, sampleGroup } from "./sample-trip";

const kicker = "font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft";

const TABS: { name: string; icon: GlyphName }[] = [
  { name: "Today", icon: "pin" },
  { name: "Dates", icon: "dates" },
  { name: "Money", icon: "money" },
  { name: "Packing", icon: "packing" },
];

function TabBar({ active }: { active: string }) {
  return (
    <div className="mt-auto grid grid-cols-4 border-t border-rule pt-2.5">
      {TABS.map((t) => (
        <span key={t.name} className={cx("flex flex-col items-center gap-1 text-[10px]", t.name === active ? "font-semibold text-pen" : "text-ink-faint")}>
          <Glyph name={t.icon} className="size-[15px]" />
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

const TODAY = [
  { at: "10:12", what: "Train to Cefalù", note: "Palermo Centrale · 55 min", icon: "train", tone: "bg-pastel-blue text-pastel-blue-ink" },
  { at: "13:00", what: "Beach, La Spiaggia", note: "Jo brings the towels", icon: "packing", tone: "bg-pastel-yellow text-pastel-yellow-ink" },
  { at: "20:30", what: "Ostaria del Duomo", note: "Table for 6 · booked", icon: "pin", tone: "bg-pastel-red text-pastel-red-ink" },
] as const;

export function TodayScreen() {
  return (
    <>
      <TripBar />
      <div className="rounded-[18px] bg-pastel-yellow px-4 py-3.5 text-pastel-yellow-ink">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em]">Today · Tue 14 Sep</p>
        <p className="mt-1 font-display text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink">Cefalù</p>
        <p className="mt-1.5 text-[12px]">Night 3 of 7 · Casa sul Mare</p>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        {TODAY.map((t) => (
          <div key={t.at} className="grid grid-cols-[30px_1fr_auto] items-center gap-2.5 rounded-[14px] border border-rule bg-sheet px-2.5 py-2 text-[13px]">
            <span className={cx("grid size-[30px] place-items-center rounded-full", t.tone)}>
              <Glyph name={t.icon} className="size-[14px]" />
            </span>
            <span className="min-w-0">
              <b className="block truncate font-semibold">{t.what}</b>
              <small className="block truncate text-[11px] text-ink-faint">{t.note}</small>
            </span>
            <span className="nums self-start pt-0.5 text-[11px] text-ink-soft">{t.at}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-[14px] bg-pastel-red px-3 py-2.5 text-[12px] text-pastel-red-ink">
        <span className={kicker + " text-current"}>Tomorrow</span>
        <b className="font-semibold text-ink">Taormina</b>
        <span className="nums ml-auto">09:40 train</span>
      </div>
      <TabBar active="Today" />
    </>
  );
}

// Figures match the feature film's money slide.
const BALANCES = [
  { who: priya, amount: "+£310.00", up: true },
  { who: sam, amount: "+£40.00", up: true },
  { who: jo, amount: "−£92.50" },
  { who: alex, amount: "−£107.50" },
];
const SPENT = [
  { what: "Thursday dinner", who: jo, cost: "£138.60" },
  { what: "Car hire", who: sam, cost: "£102.00" },
];

export function MoneyScreen() {
  return (
    <>
      <TripBar />
      <div className="rounded-[18px] bg-pen-soft px-4 py-3.5 text-pen-deep">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em]">You owe</p>
        <p className="mt-1.5 flex items-center gap-2 font-display text-[17px] font-semibold">
          <Avatar name={priya.name} tone={priya.tone} size={24} /> Priya
          <span className="nums ml-auto text-[26px] tracking-[-0.02em]">£42.50</span>
        </p>
        <span className="mt-2.5 inline-flex rounded-full bg-pen px-3 py-[5px] font-mono text-[10px] uppercase tracking-[0.06em] text-sheet">Mark as paid</span>
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
      <p className={kicker + " mt-3"}>Latest</p>
      {SPENT.map((e) => (
        <div key={e.what} className="flex items-center gap-2 border-b border-rule py-1.5 text-[12px] last:border-b-0">
          <Avatar name={e.who.name} tone={e.who.tone} size={18} />
          <span className="min-w-0 flex-1 truncate">{e.what}</span>
          <span className="rounded-full bg-pastel-green px-1.5 py-px text-[10px] text-pastel-green-ink">split 6</span>
          <span className="nums">{e.cost}</span>
        </div>
      ))}
      <TabBar active="Money" />
    </>
  );
}
