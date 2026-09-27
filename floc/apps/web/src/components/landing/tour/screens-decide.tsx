import { Avatar, cx } from "@/components/system/ui";

import { Glyph } from "../landing-glyph";
import { alex, jo, kit, priya, sampleGroup } from "../sample-trip";
import { FakeButton, ScreenFrame } from "./screen-frame";

const IDEAS = [
  { title: "Sicily: food, beaches, one flight", by: priya, when: "2d ago", votes: 5, mine: true },
  { title: "Sardinia, for the quieter sea", by: kit, when: "2d ago", votes: 2, mine: false },
  { title: "Puglia, cheap in September", by: jo, when: "1d ago", votes: 1, mine: false },
  { title: "Lisbon and the coast", by: alex, when: "5h ago", votes: 1, mine: false },
];

function UpGlyph() {
  return (
    <svg viewBox="0 0 14 14" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 11.2V3.2M3.6 6.6 7 3.2l3.4 3.4" />
    </svg>
  );
}

export function WhereScreen() {
  return (
    <ScreenFrame active="overview">
      <div className="overflow-hidden rounded-xl border border-rule bg-sheet">
        <div className="flex items-center gap-3 px-4 py-3">
          <svg viewBox="0 0 14 14" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" className="rotate-90 text-ink-faint" aria-hidden>
            <path d="M5 2.5 10 7l-5 4.5" />
          </svg>
          <h4 className="font-display text-lg">Ideas</h4>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">{IDEAS.length} ideas</span>
        </div>
        <div className="border-t border-rule px-4 pb-4 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex rounded-full border border-rule p-0.5 text-xs">
              <span className="rounded-full bg-ink px-3 py-1 text-paper">Most votes</span>
              <span className="px-3 py-1 text-ink-soft">Newest</span>
            </span>
            <span className="flex-1 rounded-[10px] border border-rule px-3 py-[7px] text-ink-faint">Lisbon, a week in September…</span>
            <FakeButton>Add</FakeButton>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">
            {IDEAS.map((idea, i) => (
              <li key={idea.title} className={cx("flex flex-col gap-3 rounded-lg border border-rule bg-sheet p-3.5", i === 0 && "bg-highlight-soft")}>
                <p className="text-[15px] leading-snug">{idea.title}</p>
                <div className="mt-auto flex items-center gap-2">
                  <Avatar name={idea.by.name} tone={idea.by.tone} size={22} />
                  <span className="truncate text-xs text-ink-soft">
                    {idea.by.name} · {idea.when}
                  </span>
                  <span className="flex-1" />
                  <span
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                      idea.mine ? "border-green-edge bg-green-soft text-green" : "border-rule text-ink-soft",
                    )}
                  >
                    <UpGlyph />
                    <span className="nums">{idea.votes}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ScreenFrame>
  );
}

// Free people per September day; 12–19 is the week all six can make.
const FREE = [2, 3, 1, 2, 4, 3, 2, 3, 4, 5, 4, 6, 6, 6, 6, 6, 6, 6, 6, 3, 2, 4, 3, 1, 2, 3, 2, 1, 2, 3];
const FREE_DAYS = [11, 9, 14, 8, 12, 10];

export function WhenScreen() {
  return (
    <ScreenFrame active="dates">
      <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-[22px] max-[860px]:grid-cols-1">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-display text-lg font-semibold">September 2027</h4>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-[3px] text-xs font-semibold text-green">
              <Glyph name="check" className="size-3" /> 12–19 · all 6 free
            </span>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <em key={d} className="text-center font-mono text-[10px] not-italic text-ink-faint">{d}</em>
            ))}
            <i />
            <i />
            {FREE.map((free, i) => {
              const day = i + 1;
              const agreed = day >= 12 && day <= 19;
              return (
                <span
                  key={day}
                  className={cx("flex h-[46px] flex-col justify-between rounded-[8px] px-1.5 py-1", agreed && "bg-pen text-sheet")}
                  style={agreed ? undefined : { background: `color-mix(in srgb, var(--pen) ${free * 11}%, var(--sheet-2))` }}
                >
                  <b className="text-xs font-medium">{day}</b>
                  <small className="font-mono text-[9px] opacity-70">{free}/6</small>
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-[38px] max-[860px]:hidden">
          {sampleGroup.map((p, i) => (
            <div key={p.name} className="grid grid-cols-[22px_1fr_auto] items-center gap-2">
              <Avatar name={p.name} tone={p.tone} size={22} />
              <span>{p.name}</span>
              <span className="nums text-[11px] text-ink-faint">{FREE_DAYS[i]} days</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}
