import { Avatar, cx } from "@/components/system/ui";

import { Glyph, type GlyphName } from "../landing-glyph";
import { jo, maya, sam, you, type SamplePerson } from "../sample-trip";
import { FakeButton, ScreenFrame, muted, stayTone } from "./screen-frame";

const SHARED: { item: string; who: SamplePerson | null }[] = [
  { item: "Speaker", who: sam },
  { item: "Adapters ×3", who: jo },
  { item: "Beach umbrella", who: maya },
  { item: "Sun cream", who: you },
  { item: "First-aid kit", who: null },
];
const MINE = [
  { item: "Passport", done: true },
  { item: "Swimwear", done: true },
  { item: "Walking shoes", done: true },
  { item: "Phone charger", done: false },
  { item: "Sun hat", done: false },
  { item: "Etna jacket", done: false },
];
const row = "flex items-center gap-2.5 border-b border-rule px-2.5 py-2";

function ListHead({ title, count }: { title: string; count: string }) {
  return (
    <h5 className="mb-2 flex items-baseline justify-between font-display text-[15px] font-semibold">
      {title} <span className="nums text-[11px] font-normal text-ink-faint">{count}</span>
    </h5>
  );
}

export function PackingScreen() {
  return (
    <ScreenFrame active="packing">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <ListHead title="Shared" count="4 of 5 claimed" />
          {SHARED.map(({ item, who }) => (
            <div key={item} className={cx(row, "justify-between")}>
              <span>{item}</span>
              {who ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                  <Avatar name={who.name} tone={who.tone} size={20} />
                  {who.name}
                </span>
              ) : (
                <FakeButton small>Claim</FakeButton>
              )}
            </div>
          ))}
        </div>
        <div>
          <ListHead title="Yours" count="3 of 6 packed" />
          {MINE.map(({ item, done }) => (
            <div key={item} className={row}>
              <i
                className={cx(
                  "grid size-[18px] place-items-center rounded-[6px] border-[1.5px]",
                  done ? "border-green bg-green text-sheet" : "border-rule-strong",
                )}
              >
                {done ? <Glyph name="check" className="size-3" /> : null}
              </i>
              <span className={cx(done && "text-ink-faint line-through")}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}

const FILES: { icon: GlyphName; name: string; meta: string; tone: string }[] = [
  { icon: "flight", name: "Flights LGW → PMO", meta: "Sun 12 Sep · 6 passes", tone: stayTone.blue },
  { icon: "train", name: "Train to Taormina", meta: "Wed 15 Sep · 6 tickets", tone: stayTone.yellow },
  { icon: "files", name: "Flat in Palermo", meta: "booking.pdf", tone: stayTone.red },
  { icon: "files", name: "Car hire", meta: "voucher.pdf", tone: stayTone.green },
  { icon: "pin", name: "Etna jeep tour", meta: "Thu 16 Sep · 6 tickets", tone: stayTone.yellow },
  { icon: "flight", name: "Flights CTA → LGW", meta: "Sun 19 Sep · 6 passes", tone: stayTone.blue },
];

export function TicketsScreen() {
  return (
    <ScreenFrame active="files">
      <div className="grid grid-cols-3 gap-3">
        {FILES.map((f) => (
          <div key={f.name} className="flex flex-col gap-1 rounded-[14px] border border-rule bg-sheet p-3.5">
            <span className={cx("mb-2 grid size-[34px] place-items-center rounded-[10px]", f.tone)}>
              <Glyph name={f.icon} />
            </span>
            <b>{f.name}</b>
            <span className={cx(muted, "nums text-[11px]")}>{f.meta}</span>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}
