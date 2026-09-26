import type { ReactNode } from "react";

import { AvatarRow, cx } from "@/components/system/ui";
import { TABS, type TabState } from "@/lib/tabs";

import { sampleGroup } from "../sample-trip";

export const muted = "text-xs text-ink-faint";
export const stayTone = {
  blue: "bg-pastel-blue text-pastel-blue-ink",
  yellow: "bg-pastel-yellow text-pastel-yellow-ink",
  red: "bg-pastel-red text-pastel-red-ink",
  green: "bg-pastel-green text-pastel-green-ink",
} as const;

/** A drawn trip page: the real tab set, one tab open. Illustrative, not a live read. */
export function ScreenFrame({ active, children }: { active: TabState["key"]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-rule bg-sheet text-left text-[13px] text-ink shadow-lifted">
      <div className="flex items-center justify-between px-[18px] py-3">
        <span className="flex items-baseline gap-2.5 font-display text-lg font-semibold">
          Sicily <span className="nums text-[11px] font-normal text-ink-faint">12–19 Sep</span>
        </span>
        <AvatarRow people={sampleGroup} max={6} size={22} />
      </div>
      <div className="flex gap-1 border-b border-rule px-3.5 pb-3">
        {TABS.map((t) => (
          <span key={t.key} className={cx("rounded-full px-[11px] py-[5px] text-xs", t.key === active ? "bg-ink text-paper" : "text-ink-faint")}>
            {t.label}
          </span>
        ))}
      </div>
      <div className="min-h-[420px] px-[22px] pb-[60px] pt-5">{children}</div>
    </div>
  );
}

export function FakeButton({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full bg-pen font-mono uppercase tracking-[0.06em] text-sheet",
        small ? "px-2.5 py-[3px] text-[10px]" : "px-3.5 py-[7px] text-[11px]",
      )}
    >
      {children}
    </span>
  );
}
