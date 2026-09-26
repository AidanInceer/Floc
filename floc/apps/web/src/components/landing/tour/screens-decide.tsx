import { Avatar, AvatarRow, cx } from "@/components/system/ui";

import { Glyph } from "../landing-glyph";
import { alex, jo, kit, maya, priya, sam, sampleGroup } from "../sample-trip";
import { ScreenFrame, muted } from "./screen-frame";

const VOTES = [
  { place: "Sicily", why: "Food, beaches, one flight", who: [priya, sam, jo, alex, maya] },
  { place: "Sardinia", why: "Quieter, better sea", who: [kit, alex] },
  { place: "Puglia", why: "Cheap in September", who: [jo] },
];
const head = "border-b border-rule px-2.5 pb-2 text-left font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-faint";

export function WhereScreen() {
  return (
    <ScreenFrame active="notes">
      <h4 className="font-display text-[22px] font-semibold tracking-[-0.015em]">Where should we go?</h4>
      <p className={cx(muted, "mt-1")}>Add a place, say why, vote with your face.</p>
      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr>
            <th className={head}>Place</th>
            <th className={head}>Why</th>
            <th className={head}>Votes</th>
          </tr>
        </thead>
        <tbody>
          {VOTES.map((v, i) => (
            <tr key={v.place} className={cx(i === 0 && "bg-highlight-soft")}>
              <td className="border-b border-rule p-2.5 font-semibold">{v.place}</td>
              <td className="border-b border-rule p-2.5">{v.why}</td>
              <td className="border-b border-rule p-2.5">
                <AvatarRow people={v.who} size={20} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-rule px-3 py-2.5">
        <Glyph name="notes" />
        <span>
          <b>A week in eastern Sicily</b>
          <br />
          <span className={muted}>Pasted by Priya · 3 comments</span>
        </span>
      </div>
      <div className="mt-3 flex w-fit items-center gap-2 rounded-[12px] bg-pastel-red px-3 py-2">
        <Avatar name={jo.name} tone={jo.tone} size={20} />
        <span>
          <b>Jo</b> Sicily gets my vote. Etna is non-negotiable.
        </span>
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
      <div className="grid grid-cols-[1fr_180px] gap-[22px]">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-display text-lg font-semibold">September 2027</h4>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-[3px] text-xs font-semibold text-green">
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
        <div className="flex flex-col gap-2 pt-[38px]">
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
