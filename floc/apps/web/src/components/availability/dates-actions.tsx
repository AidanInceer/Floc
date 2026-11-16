import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";

const QUIET = "hover:!border-red/60 hover:!bg-red-soft hover:!text-red hover:!shadow-none";

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
    <div className="flex flex-wrap justify-end gap-2">
      <form action={clear}>
        <SubmitButton variant="secondary" disabled={!hasMarks} className={QUIET}>
          Clear availability
        </SubmitButton>
      </form>
      <form action={reset}>
        {resetCost ? (
          <ConfirmSubmit variant="danger" message={resetCost.message} confirmLabel={resetCost.label}>
            Reset dates
          </ConfirmSubmit>
        ) : (
          <SubmitButton variant="danger" disabled={!hasDates}>
            Reset dates
          </SubmitButton>
        )}
      </form>
    </div>
  );
}
