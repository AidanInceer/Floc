import { PackingCube } from "@/components/packing/packing-cube";
import { PackingLane } from "@/components/packing/packing-lane";
import { CategoryChip, KindChip } from "@/components/documents/document-row";
import { CheckIcon, UploadIcon } from "@/components/system/icons";
import { Avatar, cx } from "@/components/system/ui";
import type { DocCategory } from "@floc/core/documents/documents";

import { jo, maya, sam, type SamplePerson } from "../sample-trip";
import { FakeButton, PageHead } from "./screen-frame";

const BAG = [
  { heading: "Essentials", items: [{ n: 1, item: "passport", done: true }, { n: 1, item: "phone charger", done: false }, { n: 1, item: "sun hat", done: false }] },
  { heading: "Clothes", items: [{ n: 2, item: "swimwear", done: true }, { n: 1, item: "walking shoes", done: true }, { n: 1, item: "Etna jacket", done: false }] },
];
const CLAIMED: { item: string; who: SamplePerson }[] = [
  { item: "Speaker", who: sam },
  { item: "Adapters ×3", who: jo },
  { item: "Beach umbrella", who: maya },
];

export function PackingScreen() {
  return (
    <>
      <PageHead title="Packing" />
      <div className="flex items-center gap-3">
        <h5 className="font-display text-lg font-semibold">Your bag</h5>
        <span className="nums font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">6 things · 3 packed</span>
      </div>
      <span className="mt-2.5 inline-flex gap-0.5 rounded-md bg-sheet-3 p-[3px] text-xs">
        <span className="rounded-sm px-3 py-[3px] text-ink-soft">Light</span>
        <span className="rounded-sm bg-sheet px-3 py-[3px] text-ink shadow-card">Balanced</span>
        <span className="rounded-sm px-3 py-[3px] text-ink-soft">Comfort</span>
      </span>
      <div className="mt-3 grid grid-cols-2 items-start gap-3">
        {BAG.map((group) => (
          <PackingCube key={group.heading} heading={group.heading} total={group.items.length} packed={group.items.filter((i) => i.done).length}>
            {group.items.map(({ n, item, done }) => (
              <li key={item} className="flex items-center gap-2.5 px-3 py-2">
                <span className={cx("grid size-[18px] shrink-0 place-items-center rounded-sm border", done ? "border-green-edge bg-green-soft text-green" : "border-rule-strong")}>
                  {done ? <CheckIcon size={11} /> : null}
                </span>
                <span className={cx("min-w-0 flex-1 truncate", done && "text-ink-soft")}>
                  <span className="nums text-ink-faint">{n} — </span>
                  {item}
                </span>
              </li>
            ))}
          </PackingCube>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <h5 className="font-display text-lg font-semibold">Who&rsquo;s bringing what</h5>
        <span className="nums font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">3 of 4 claimed</span>
      </div>
      <div className="mt-3 grid grid-cols-2 items-start gap-3">
        <PackingLane name="Up for grabs" count={1} open>
          <li className="flex items-center gap-2 px-3 py-2">
            <span className="min-w-0 flex-1 truncate">First-aid kit</span>
            <FakeButton small>I&rsquo;ll bring it</FakeButton>
          </li>
        </PackingLane>
        <PackingLane name="Claimed" count={CLAIMED.length}>
          {CLAIMED.map((line) => (
            <li key={line.item} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{line.item}</span>
              <Avatar name={line.who.name} tone={line.who.tone} size={18} />
            </li>
          ))}
        </PackingLane>
      </div>
    </>
  );
}

const SHARED: { name: string; category: DocCategory; mime: string; meta: string }[] = [
  { name: "Flights LGW–PMO.pdf", category: "travel", mime: "application/pdf", meta: "Priya · 1.2 MB" },
  { name: "Flat in Palermo.pdf", category: "stay", mime: "application/pdf", meta: "Sam · 840 KB" },
  { name: "Train to Taormina.pdf", category: "tickets", mime: "application/pdf", meta: "Jo · 320 KB" },
  { name: "Etna jeep tour.png", category: "tickets", mime: "image/png", meta: "Alex · 410 KB" },
];
const YOURS: typeof SHARED = [
  { name: "Insurance.pdf", category: "admin", mime: "application/pdf", meta: "You · 180 KB" },
  { name: "Passport.jpg", category: "admin", mime: "image/jpeg", meta: "You · 95 KB" },
];

function FileList({ title, note, files }: { title: string; note: string; files: typeof SHARED }) {
  return (
    <section className="min-w-0">
      <header className="mb-2 flex items-baseline gap-2">
        <b className="font-display text-[15px] font-semibold">{title}</b>
        <span className="text-[11px] text-ink-soft">{note}</span>
      </header>
      <ul className="divide-y divide-rule rounded-md border border-rule bg-sheet">
        {files.map((f) => (
          <li key={f.name} className="flex items-center gap-2.5 px-3 py-2">
            <KindChip mimeType={f.mime} />
            <span className="flex min-w-0 flex-1 flex-col leading-snug">
              <b className="truncate font-medium text-pen">{f.name}</b>
              <span className="nums truncate text-[11px] text-ink-soft">{f.meta}</span>
            </span>
            <CategoryChip category={f.category} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TicketsScreen() {
  return (
    <>
      <PageHead title="Files" />
      <div className="flex items-center gap-3 rounded-md border border-rule bg-sheet px-4 py-2.5">
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-ink-soft">Forward a booking email here. Its attachments land in Yours.</span>
          <span className="block truncate font-mono text-xs">trip-14-8f2c1a9e@in.floc.app</span>
        </span>
        <FakeButton small quiet>Copy address</FakeButton>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <span className="rounded-sm border border-ink bg-ink px-3 py-1 text-sheet">All</span>
        <span className="px-3 py-1 text-ink-soft">Travel · 1</span>
        <span className="px-3 py-1 text-ink-soft">Stay · 1</span>
        <span className="px-3 py-1 text-ink-soft">Tickets · 2</span>
        <span className="px-3 py-1 text-ink-soft">Admin · 2</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-sm bg-pen px-3 py-[5px] font-mono text-[10.5px] uppercase tracking-[0.06em] text-sheet">
          <UploadIcon size={11} /> Upload
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-3">
        <FileList title="Shared" note="Everyone on the trip" files={SHARED} />
        <FileList title="Yours" note="Only you can see these" files={YOURS} />
      </div>
      <p className="mt-3 flex items-center justify-end gap-2.5">
        <span className="h-1 w-24 overflow-hidden rounded-full bg-rule">
          <span className="block h-full w-[12%] rounded-full bg-pen" />
        </span>
        <span className="nums font-mono text-[10.5px] text-ink-soft">3 MB of 1 GB used</span>
      </p>
    </>
  );
}

