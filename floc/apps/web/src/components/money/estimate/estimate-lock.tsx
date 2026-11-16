import Link from "next/link";

import { buttonClass, cx } from "@/components/system/ui";

const LOCK = <path d="M2.8 6.2h8.4v6H2.8zM4.8 6.2V4.6a2.2 2.2 0 0 1 4.4 0v1.6" />;

export function EstimateLock() {
  return (
    <section className="grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded-md border border-rule bg-sheet px-4 py-3.5 max-sm:grid-cols-[26px_1fr]">
      <span className="grid size-[26px] place-items-center rounded-sm bg-sheet-3 text-ink">
        <svg viewBox="0 0 14 14" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {LOCK}
        </svg>
      </span>
      <div>
        <p className="text-[15px] font-semibold text-ink">Cost estimate and budget</p>
        <p className="text-[13px] text-ink-soft">See roughly what this trip will cost you, set your own budget and track it. Only you see it. A Floc Pro feature.</p>
      </div>
      <Link href="/profile?section=billing#settings-billing" className={cx(buttonClass("pro"), "max-sm:col-start-2 max-sm:justify-self-start")}>
        See Floc Pro
      </Link>
    </section>
  );
}
