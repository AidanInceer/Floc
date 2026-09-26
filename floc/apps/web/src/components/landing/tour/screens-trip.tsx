import { Avatar, cx } from "@/components/system/ui";

import { alex, jo, maya, priya, sam, you } from "../sample-trip";
import { FakeButton, ScreenFrame, muted, stayTone } from "./screen-frame";
import { SicilySketch } from "./sicily-sketch";

const DAYS = [
  { day: "Sun 12", stay: "Palermo", tone: stayTone.blue, what: "Land 14:05 · Ballarò market" },
  { day: "Mon 13", stay: "Palermo", tone: stayTone.blue, what: "Street food walk, 10:00" },
  { day: "Tue 14", stay: "Cefalù", tone: stayTone.yellow, what: "Beach. That’s the plan." },
  { day: "Wed 15", stay: "Taormina", tone: stayTone.red, what: "09:40 train · Teatro Antico" },
  { day: "Thu 16", stay: "Taormina", tone: stayTone.red, what: "Etna jeep tour, 08:30" },
  { day: "Fri 17", stay: "Syracuse", tone: stayTone.green, what: "Ortigia market" },
  { day: "Sat 18", stay: "Syracuse", tone: stayTone.green, what: "Boat to the sea caves" },
];

export function PlanScreen() {
  return (
    <ScreenFrame active="days">
      <div className="grid grid-cols-[1fr_230px] gap-5">
        <div className="flex flex-col gap-1.5">
          {DAYS.map((d) => (
            <div key={d.day} className="grid grid-cols-[58px_92px_1fr] items-center gap-2.5 rounded-[10px] border border-rule px-2.5 py-2">
              <span className="nums text-[11px] text-ink-faint">{d.day}</span>
              <span className={cx("w-fit rounded-full px-[9px] py-[3px] text-[11px] font-semibold", d.tone)}>{d.stay}</span>
              <span>{d.what}</span>
            </div>
          ))}
        </div>
        <div className="self-start rounded-[14px] bg-pastel-blue p-3">
          <SicilySketch />
          <p className="nums mt-1.5 text-[11px] text-pastel-blue-ink">4 stops · 7 nights</p>
        </div>
      </div>
    </ScreenFrame>
  );
}

// Balances sum to zero: what each person paid less their sixth of the bills.
const BALANCES = [
  { who: priya, amount: "+£310.00", up: true },
  { who: sam, amount: "+£40.00", up: true },
  { who: you, amount: "−£42.50" },
  { who: jo, amount: "−£92.50" },
  { who: alex, amount: "−£107.50" },
  { who: maya, amount: "−£107.50" },
];
const EXPENSES = [
  { what: "Flat in Palermo", who: priya, cost: "£960.00" },
  { what: "Car hire", who: sam, cost: "£102.00" },
  { what: "Thursday dinner", who: jo, cost: "£138.60" },
  { what: "Ferry to the caves", who: alex, cost: "£72.00" },
];

export function MoneyScreen() {
  return (
    <ScreenFrame active="money">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[14px] bg-pen-soft p-[18px] text-pen-deep">
          <p className="text-xs">You owe</p>
          <p className="mb-3.5 mt-1.5 flex items-center gap-2.5 font-display text-2xl font-semibold">
            <Avatar name={priya.name} tone={priya.tone} size={30} /> Priya
            <span className="nums ml-auto text-[26px]">£42.50</span>
          </p>
          <FakeButton>Mark as paid</FakeButton>
        </div>
        <div className="row-span-2 flex flex-col gap-1.5">
          {BALANCES.map((b) => (
            <div
              key={b.who.name}
              className={cx(
                "grid grid-cols-[20px_1fr_auto] items-center gap-2 rounded-[10px] px-2.5 py-[7px]",
                b.who === you ? "bg-pen-soft font-semibold text-pen-deep" : "bg-sheet-2",
              )}
            >
              <Avatar name={b.who.name} tone={b.who.tone} size={20} />
              <span>{b.who.name}</span>
              <span className={cx("nums", b.up && "text-green")}>{b.amount}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {EXPENSES.map((e) => (
            <div key={e.what} className="flex items-center justify-between border-b border-rule px-0.5 py-[7px]">
              <span>
                <b>{e.what}</b>
                <br />
                <span className={muted}>{e.who.name} paid · split 6 ways</span>
              </span>
              <span className="nums">{e.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}
