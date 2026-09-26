import type { Window } from "@floc/core/dates/availability";
import { dateRange, formatDateRange } from "@floc/core/dates/dates";
import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";

/**
 * The overlap, said — so nobody counts it off the heatmap. One press commits
 * it; a window that drops planned days confirms first, as the grid does (#140).
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
    <section className="flex items-center gap-3 rounded-md border border-pastel-green-edge bg-pastel-green px-4 py-3 text-pastel-green-ink">
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold">
          {formatDateRange(window.start, window.end)}
        </p>
        <p className="nums font-mono text-[11px]">
          {days} {days === 1 ? "day" : "days"} · {who}
        </p>
      </div>
      {current ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.06em]">Set</span>
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
