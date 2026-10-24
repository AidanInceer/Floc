import type { Window } from "@floc/core/dates/availability";
import { dateRange } from "@floc/core/dates/dates";
import { spanLabel } from "@floc/core/dates/dates-tabs";
import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";

/**
 * The overlap, said — so nobody counts it off the calendar. One press commits
 * it; a window that drops planned days confirms first, as the grid does (#140).
 * A block in the Dates panel, neutral: its days may be some-free, not all-free.
 */
export function BestWindowCard({
  window,
  memberCount,
  current,
  cost,
  apply,
}: {
  window: Window;
  memberCount: number;
  current: boolean;
  cost: { noun: string; label: string } | null;
  apply: () => Promise<void>;
}) {
  const days = dateRange(window.start, window.end).length;
  const who =
    window.free === memberCount
      ? `all ${memberCount} free`
      : `${window.free} of ${memberCount} free`;

  return (
    <section className="flex flex-wrap items-end gap-x-3 gap-y-2 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">Best fit</p>
        <p className="nums mt-1 font-mono text-base text-ink">
          {spanLabel(window.start, window.end)}
        </p>
        <p className="nums font-mono text-[11px] text-ink-soft">
          {days} {days === 1 ? "day" : "days"} · {who}
        </p>
      </div>
      {current ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-green">Set</span>
      ) : (
        <form action={apply}>
          {cost ? (
            <ConfirmSubmit
              variant="primary"
              confirmVariant="danger"
              message={`These dates remove ${cost.noun} from the itinerary.`}
              confirmLabel={cost.label}
              pendingLabel="Setting…"
            >
              Use these
            </ConfirmSubmit>
          ) : (
            <SubmitButton pendingLabel="Setting…">Use these</SubmitButton>
          )}
        </form>
      )}
    </section>
  );
}
