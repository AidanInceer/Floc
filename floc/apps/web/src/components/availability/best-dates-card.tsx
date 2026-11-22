"use client";

import { AsideHead } from "@/components/availability/dates-board-parts";
import { ChevronIcon } from "@/components/system/icons";
import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";
import { iconButtonClass } from "@/components/system/ui";
import { spanLabel } from "@floc/core/dates/dates-tabs";
import { NO_DAYS_MARKED } from "@floc/core/dates/words";

export type BestDate = {
  start: string;
  end: string;
  headline: string;
  reasons: string[];
  cost: { noun: string; label: string } | null;
};

function Pager({ at, of, onStep }: { at: number; of: number; onStep: (delta: number) => void }) {
  return (
    <span className="flex items-center gap-1">
      <button type="button" aria-label="Previous option" className={iconButtonClass(false)} onClick={() => onStep(-1)}>
        <ChevronIcon direction="left" />
      </button>
      <span className="nums font-mono text-[11px] text-ink-soft">
        {at + 1} of {of}
      </span>
      <button type="button" aria-label="Next option" className={iconButtonClass(false)} onClick={() => onStep(1)}>
        <ChevronIcon direction="right" />
      </button>
    </span>
  );
}

export function BestDatesCard({
  windows,
  at,
  onStep,
  state,
  apply,
}: {
  windows: BestDate[];
  at: number;
  onStep: (delta: number) => void;
  state: "new" | "change" | "set";
  apply: (start: string, end: string) => Promise<void>;
}) {
  const verb = state === "change" ? "Change dates" : "Set the dates";
  const w = windows[at];
  if (!w)
    return (
      <section className="p-4">
        <AsideHead title="Best dates" />
        <p className="mt-1 text-[13px] text-ink-soft">{NO_DAYS_MARKED}</p>
      </section>
    );

  return (
    <section className="p-4">
      <AsideHead title="Best dates" meta={windows.length > 1 ? <Pager at={at} of={windows.length} onStep={onStep} /> : null} />
      <p className="nums mt-1 font-mono text-base text-ink">{spanLabel(w.start, w.end)}</p>
      <p className="mt-0.5 text-[13px] text-ink-soft">{w.headline}</p>
      {w.reasons.length ? (
        <ul className="mt-1.5 text-[13px] text-ink-soft">
          {w.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3">
        {state === "set" ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-green">Set</span>
        ) : (
          <form action={apply.bind(null, w.start, w.end)}>
            {w.cost ? (
              <ConfirmSubmit
                variant="primary"
                confirmVariant="danger"
                message={`These dates remove ${w.cost.noun} from the itinerary.`}
                confirmLabel={w.cost.label}
              >
                {verb}
              </ConfirmSubmit>
            ) : (
              <SubmitButton>{verb}</SubmitButton>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
