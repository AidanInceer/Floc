import { Avatar, cx } from "@/components/system/ui";

import { Glyph } from "../landing-glyph";
import { jo, maya } from "../sample-trip";
import { ScreenFrame } from "./screen-frame";

const PAGES = [
  { title: "Where we’re eating", open: true },
  { title: "Day trips" },
  { title: "Etna", child: true },
  { title: "Aeolian islands", child: true },
  { title: "House rules" },
];

function TripLink({ label }: { label: string }) {
  return (
    <span className="mx-px inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-pastel-blue-edge bg-pastel-blue px-[7px] align-baseline text-xs leading-[1.6] text-pastel-blue-ink">
      <Glyph name="pin" className="size-[11px]" />
      {label}
    </span>
  );
}

export function NotesScreen() {
  return (
    <ScreenFrame active="notes">
      <div className="grid grid-cols-[150px_1fr] gap-5">
        <ul className="flex flex-col gap-0.5 text-xs">
          {PAGES.map((p) => (
            <li
              key={p.title}
              className={cx("truncate rounded-[8px] px-2 py-1.5", p.child && "ml-3.5", p.open ? "bg-sheet-2 font-semibold text-ink" : "text-ink-soft")}
            >
              {p.title}
            </li>
          ))}
          <li className="mt-1 flex items-center gap-1.5 px-2 py-1.5 text-ink-faint">
            <Glyph name="plus" className="size-[11px]" />
            New page
          </li>
        </ul>
        <div className="min-w-0">
          <h4 className="font-display text-[22px] font-semibold tracking-[-0.015em]">Where we&rsquo;re eating</h4>
          <ul className="mt-3 flex list-disc flex-col gap-4 pl-5 leading-[1.7]">
            <li>
              <b>Antica Focacceria</b> for arancini on <TripLink label="Day 1 · Palermo" />
            </li>
            <li>
              <b>Granita at Bam Bar</b>, the morning of <TripLink label="Day 5 · Taormina" />
            </li>
            <li>
              Fish market lunch in Ortigia
              <span className={cx("relative mx-px inline-block h-[1.15em] border-l-2 border-current align-text-bottom", jo.tone)}>
                <span className={cx("absolute bottom-full left-[-2px] whitespace-nowrap rounded-[4px_4px_4px_0] px-[5px] font-mono text-[10px] leading-4", jo.tone)}>
                  {jo.name}
                </span>
              </span>
            </li>
          </ul>
          <div className="mt-5 flex w-fit max-w-full items-start gap-2 rounded-[12px] border border-rule bg-sheet px-3 py-2.5">
            <Avatar name={maya.name} tone={maya.tone} size={20} />
            <span>
              <b>Maya</b> Booked Antica for eight, 8pm.
            </span>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
