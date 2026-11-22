import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";

const QUIET = "hover:!border-red/60 hover:!bg-red-soft hover:!text-red hover:!shadow-none";
const ONE_LINE = "whitespace-nowrap max-sm:!px-2";

export function DatesActions({
  reset,
  clear,
  resetCost,
  hasDates,
  hasMarks,
}: {
  reset: () => Promise<void>;
  clear: () => Promise<void>;
  resetCost: { message: string; label: string } | null;
  hasDates: boolean;
  hasMarks: boolean;
}) {
  return (
    <div className="flex shrink-0 justify-end gap-1.5 sm:gap-2">
      <form action={clear}>
        <SubmitButton variant="secondary" disabled={!hasMarks} className={cx(QUIET, ONE_LINE)}>
          Clear availability
        </SubmitButton>
      </form>
      <form action={reset}>
        {resetCost ? (
          <ConfirmSubmit variant="danger" message={resetCost.message} confirmLabel={resetCost.label} className={ONE_LINE}>
            <span>Reset<span className="max-sm:sr-only"> dates</span></span>
          </ConfirmSubmit>
        ) : (
          <SubmitButton variant="danger" disabled={!hasDates} className={ONE_LINE}>
            <span>Reset<span className="max-sm:sr-only"> dates</span></span>
          </SubmitButton>
        )}
      </form>
    </div>
  );
}
