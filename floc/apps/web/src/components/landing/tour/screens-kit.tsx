import { PackingCube } from "@/components/packing/packing-cube";
import { PackingLane } from "@/components/packing/packing-lane";
import { CategoryChip } from "@/components/documents/document-row";
import { Avatar, cx } from "@/components/system/ui";
import type { DocCategory } from "@floc/core/documents/documents";

import { Glyph } from "../landing-glyph";
import { jo, maya, sam, you, type SamplePerson } from "../sample-trip";
import { FakeButton, ScreenFrame } from "./screen-frame";

const BAG = [
  { heading: "Essentials", items: [{ item: "Passport", done: true }, { item: "Phone charger", done: false }, { item: "Sun hat", done: false }] },
  { heading: "Clothes", items: [{ item: "Swimwear", done: true }, { item: "Walking shoes", done: true }, { item: "Etna jacket", done: false }] },
];
const SHARED: { item: string; who: SamplePerson | null; category: string }[] = [
  { item: "First-aid kit", who: null, category: "Essentials" },
  { item: "Speaker", who: sam, category: "Accessories" },
  { item: "Adapters ×3", who: jo, category: "Accessories" },
  { item: "Beach umbrella", who: maya, category: "Accessories" },
  { item: "Sun cream", who: you, category: "Toiletries" },
];
const CLAIMED = SHARED.filter((line): line is { item: string; who: SamplePerson; category: string } => line.who !== null);

export function PackingScreen() {
  return (
    <ScreenFrame active="packing">
      <div className="flex items-center gap-3">
        <h4 className="font-display text-lg font-semibold">Your bag</h4>
        <span className="nums text-[11px] text-ink-faint">3/6 packed</span>
      </div>
      <div className="mt-3 grid grid-cols-2 items-start gap-3">
        {BAG.map((group) => (
          <PackingCube key={group.heading} heading={group.heading} total={group.items.length} packed={group.items.filter((i) => i.done).length}>
            {group.items.map(({ item, done }) => (
              <li key={item} className="flex items-center gap-2.5 px-3 py-2">
                <span className={cx("grid size-[18px] shrink-0 place-items-center rounded-[5px] border", done ? "border-green bg-green text-sheet" : "border-rule-strong")}>
                  {done ? <Glyph name="check" className="size-3" /> : null}
                </span>
                <span className={cx(done && "text-ink-faint line-through")}>{item}</span>
              </li>
            ))}
          </PackingCube>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <h4 className="font-display text-lg font-semibold">Who&rsquo;s bringing what</h4>
        <span className="nums text-[11px] text-ink-faint">4/5 claimed</span>
      </div>
      <div className="mt-3 grid grid-cols-2 items-start gap-3">
        <PackingLane name="Up for grabs" count={1} open>
          {SHARED.filter((line) => !line.who).map((line) => (
            <li key={line.item} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{line.item}</span>
              <FakeButton small>I&rsquo;ll bring it</FakeButton>
            </li>
          ))}
        </PackingLane>
        {CLAIMED.slice(0, 1).map((line) => (
          <PackingLane key={line.item} name={line.who.name} count={1} avatar={<Avatar name={line.who.name} tone={line.who.tone} size={24} />}>
            <li className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{line.item}</span>
              <span className="text-[11px] text-ink-soft">{line.category}</span>
            </li>
          </PackingLane>
        ))}
      </div>
    </ScreenFrame>
  );
}

const FILES: { name: string; category: DocCategory; kind: string; meta: string }[] = [
  { name: "Flights LGW–PMO.pdf", category: "travel", kind: "PDF", meta: "Priya · 1.2 MB" },
  { name: "Flat in Palermo.pdf", category: "stay", kind: "PDF", meta: "Sam · 840 KB" },
  { name: "Train to Taormina.pdf", category: "tickets", kind: "PDF", meta: "Jo · 320 KB" },
  { name: "Car hire.pdf", category: "travel", kind: "PDF", meta: "Alex · 580 KB" },
];

export function TicketsScreen() {
  return (
    <ScreenFrame active="files">
      <div className="flex items-center gap-2 rounded-full border border-rule bg-sheet px-3 py-2">
        <span className="rounded-full bg-ink px-3 py-1 text-xs text-sheet">All</span>
        <span className="rounded-full border border-rule px-3 py-1 text-xs text-ink-soft">Travel · 2</span>
        <span className="rounded-full border border-rule px-3 py-1 text-xs text-ink-soft">Stay · 1</span>
        <span className="ml-auto"><FakeButton small>Upload</FakeButton></span>
      </div>
      <div className="mt-4 overflow-hidden rounded-[16px] border border-rule bg-sheet">
        <div className="flex items-center gap-3 border-b border-rule bg-sheet-2 px-4 py-3">
          <b className="font-display text-[15px]">Shared</b>
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">Everyone on the trip</span>
        </div>
        <div className="divide-y divide-rule">
          {FILES.map((file) => (
            <div key={file.name} className="flex items-center gap-3 px-4 py-3">
              <span className="w-11 shrink-0 rounded-full bg-pastel-red px-2 py-0.5 text-center text-xs font-semibold text-pastel-red-ink">{file.kind}</span>
              <b className="min-w-0 flex-1 truncate text-sm text-pen">{file.name}</b>
              <CategoryChip category={file.category} />
              <span className="nums shrink-0 text-xs text-ink-soft">{file.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}
