import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { ChevronIcon } from "@/components/system/icons";
import { Avatar } from "@/components/system/ui";
import { OverviewGlobe } from "@/components/trip/overview/globe/overview-globe";
import { KindTile, StopNo } from "@/components/trip/overview/stops/stop-parts";

import { alex, jo, maya, priya, sam, sampleRoute } from "../sample-trip";
import { FakeButton, PageHead } from "./screen-frame";

type Day = { weekday: string; day: number; type: DayEventType; transport?: TransportType; what: string; more?: number };
const STOPS: { no: number; place: string; meta: string; days: Day[]; next?: string }[] = [
  {
    no: 1,
    place: "Palermo",
    meta: "2 nights · 12–14 Sept",
    days: [
      { weekday: "Sun", day: 12, type: "transport", transport: "flight", what: "Flight to Palermo", more: 1 },
      { weekday: "Mon", day: 13, type: "food", what: "Street food walk" },
    ],
    next: "Train · 1h",
  },
  {
    no: 2,
    place: "Cefalù",
    meta: "1 night · 14–15 Sept",
    days: [{ weekday: "Tue", day: 14, type: "activity", what: "Beach. That’s the plan." }],
    next: "Train · 2h 40",
  },
  {
    no: 3,
    place: "Taormina",
    meta: "2 nights · 15–17 Sept",
    days: [
      { weekday: "Wed", day: 15, type: "activity", what: "Teatro Antico" },
      { weekday: "Thu", day: 16, type: "activity", what: "Etna jeep tour", more: 1 },
    ],
  },
];

function DayRow({ d }: { d: Day }) {
  return (
    <li className="grid grid-cols-[30px_26px_minmax(0,1fr)_auto_12px] items-center gap-2.5 border-t border-rule px-1 py-1.5">
      <span className="nums grid size-[30px] place-content-center rounded-sm bg-sheet-2 text-center text-xs leading-none text-ink-soft">
        <span className="mb-0.5 text-[6.5px] uppercase tracking-[0.08em]">{d.weekday}</span>
        {d.day}
      </span>
      <KindTile type={d.type} transportType={d.transport ?? null} />
      <span className="truncate">{d.what}</span>
      <span className="nums text-[11px] text-ink-faint">{d.more ? `+${d.more}` : ""}</span>
      <ChevronIcon direction="down" size={12} className="text-ink-faint" />
    </li>
  );
}

export function PlanScreen() {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_250px] gap-4">
        <div className="flex min-w-0 flex-col">
          <h4 className="mb-3 font-display text-xl">Stops</h4>
          {STOPS.map((s) => (
            <div key={s.no}>
              <section className="rounded-md border border-rule-strong bg-sheet px-3 pb-1.5 pt-3">
                <header className="flex items-center gap-2.5">
                  <StopNo no={s.no} />
                  <b className="font-display text-lg font-normal tracking-[-0.02em]">{s.place}</b>
                  <span className="nums text-[11px] text-ink-faint">{s.meta}</span>
                </header>
                <ol className="mt-2">
                  {s.days.map((d) => (
                    <DayRow key={d.day} d={d} />
                  ))}
                </ol>
              </section>
              {s.next ? (
                <p className="ml-6 flex min-h-[26px] items-center border-l-[1.5px] border-dashed border-rule-strong pl-3 font-mono text-[11px] text-ink-faint">{s.next}</p>
              ) : null}
            </div>
          ))}
        </div>
        <div className="relative h-[360px] overflow-hidden rounded-md border border-rule bg-sheet">
          <OverviewGlobe route={sampleRoute} tone="peri" label="The route: Palermo, Cefalù, Taormina, Syracuse" />
        </div>
      </div>
    </>
  );
}

// Each person's sixth of £1,200, less what they paid; Priya paid most, so the rest owe her.
const OTHERS = [
  { who: jo, amount: "£62.00" },
  { who: sam, amount: "£98.00" },
  { who: alex, amount: "£200.00" },
  { who: maya, amount: "£200.00" },
];
const EXPENSES = [
  { what: "Flat in Palermo", who: priya, day: "Sun 12 Sept", cost: "£960.00" },
  { what: "Dinner, Ortigia", who: jo, day: "Fri 17 Sept", cost: "£138.00" },
  { what: "Car hire", who: sam, day: "Fri 17 Sept", cost: "£102.00" },
];

export function MoneyScreen() {
  return (
    <>
      <PageHead title="Money">
        <FakeButton>Add expense</FakeButton>
      </PageHead>
      <div className="grid grid-cols-2 gap-3">
        <section className="rounded-md bg-sheet px-4 py-3.5">
          <h5 className="border-b border-rule pb-2 font-display text-base font-semibold">You owe</h5>
          <div className="mt-3 flex items-center gap-2">
            <Avatar name={priya.name} tone={priya.tone} size={22} />
            <span className="flex-1">Priya</span>
            <span className="nums text-lg font-semibold">£200.00</span>
            <FakeButton small>Settle up</FakeButton>
          </div>
        </section>
        <section className="rounded-md bg-sheet px-4 py-3.5">
          <h5 className="border-b border-rule pb-2 font-display text-base font-semibold">You are owed</h5>
          <p className="mt-2 text-center font-display text-lg text-pastel-green-ink">Nothing to chase</p>
          <p className="text-center text-[11px] text-ink-soft">Everyone has paid you back.</p>
        </section>
      </div>
      <section className="mt-3 rounded-md bg-sheet px-4 py-2.5">
        <h5 className="text-[11px] font-medium text-ink-soft">Between the others</h5>
        {OTHERS.map((o) => (
          <p key={o.who.name} className="flex justify-between py-[3px] text-xs text-ink-soft">
            <span>{o.who.name} owes Priya</span>
            <span className="nums">{o.amount}</span>
          </p>
        ))}
      </section>
      <section className="mt-3 rounded-md bg-sheet px-4 pt-3">
        <h5 className="border-b border-rule pb-2 font-display text-base font-semibold">Activity</h5>
        {EXPENSES.map((e) => (
          <div key={e.what} className="flex items-center gap-3 border-b border-rule py-2">
            <span className="min-w-0 flex-1">
              <b className="font-medium">{e.what}</b>
              <span className="block text-[11px] text-ink-faint">
                {e.who.name} paid · split evenly · {e.day}
              </span>
            </span>
            <span className="nums">{e.cost}</span>
          </div>
        ))}
      </section>
    </>
  );
}
