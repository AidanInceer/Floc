import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";

const QUIET = "!px-3 !text-ink-soft hover:!bg-red-soft hover:!text-red disabled:!opacity-100 disabled:!text-ink-faint";

/**
 * Reset and clear sit under the board, quiet but in view (ticket 133: disabled, never absent).
 * Reset confirms when an itinerary rides on the window (ticket 140); clear does not — marks paint back.
 */
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
    <div className="-mr-3 flex flex-wrap justify-end gap-1">
      <form action={reset}>
        {resetCost ? (
          <ConfirmSubmit variant="ghost" confirmVariant="danger" className={QUIET} message={resetCost.message} confirmLabel={resetCost.label}>
            Reset dates
          </ConfirmSubmit>
        ) : (
          <SubmitButton variant="ghost" disabled={!hasDates} className={QUIET}>
            Reset dates
          </SubmitButton>
        )}
      </form>
      <form action={clear}>
        <SubmitButton variant="ghost" disabled={!hasMarks} className={QUIET}>
          Clear availability
        </SubmitButton>
      </form>
    </div>
  );
}
