import type { ReactNode } from "react";

import { SECTION_COLOURS, type SectionColour } from "@floc/core/design/section-colours";
import { NavGlyph } from "@/components/system/icons/nav";
import { cx } from "@/components/system/ui";
import { TABS, type TabState } from "@/lib/tabs";

const WASH: Record<SectionColour, string> = {
  blue: "bg-pastel-blue text-pastel-blue-ink",
  yellow: "bg-pastel-yellow text-pastel-yellow-ink",
  red: "bg-pastel-red text-pastel-red-ink",
  green: "bg-pastel-green text-pastel-green-ink",
};

/** A drawn trip page: the real tab bar, one tab open, on the paper ground. Illustrative, not a live read. */
export function ScreenFrame({ active, children }: { active: TabState["key"]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-rule bg-paper text-left text-[13px] text-ink shadow-lifted">
      <div className="flex items-center justify-center gap-3.5 border-b border-rule bg-sheet px-4 py-2.5">
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <span key={t.key} className={cx("flex items-center gap-1.5 text-xs font-medium", on ? "text-ink" : "text-ink-faint")}>
              <span className={cx("inline-flex size-6 items-center justify-center rounded-sm", on && WASH[SECTION_COLOURS[t.key] ?? "blue"])}>
                <NavGlyph name={t.key} />
              </span>
              <span className="max-[640px]:hidden">{t.label}</span>
            </span>
          );
        })}
      </div>
      <div className="h-[500px] overflow-hidden px-[22px] pb-[60px] pt-5">{children}</div>
    </div>
  );
}

/** The page's own title, as each tab opens with one. */
export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h4 className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em]">{title}</h4>
        {sub ? <p className="nums mt-1.5 text-[11px] text-ink-soft">{sub}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function FakeButton({ children, small, quiet }: { children: ReactNode; small?: boolean; quiet?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-sm font-mono uppercase tracking-[0.06em]",
        quiet ? "border border-rule-strong bg-sheet text-ink" : "bg-pen text-sheet",
        small ? "px-2.5 py-[3px] text-[10px]" : "px-3.5 py-[7px] text-[11px]",
      )}
    >
      {children}
    </span>
  );
}
