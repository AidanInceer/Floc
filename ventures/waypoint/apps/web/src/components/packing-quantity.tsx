"use client";

/**
 * The count on a row in your bag, and the two buttons that change it.
 *
 * One component rather than a number beside a form, because the pair only
 * makes sense together: pressing plus has to move the number *now*. The write
 * is still the same server action, but a step revalidates the whole tab —
 * every list, the roster, the forecast — and waiting on all that for "5 → 6"
 * reads as a broken button. `useOptimistic` shows the answer straight away and
 * is overwritten by the server's when it lands, so a rejected step corrects
 * itself rather than sticking.
 */
import { useOptimistic } from "react";

import { cx } from "@/components/ui";
import {
  clampPackQuantity,
  MAX_PACK_QUANTITY,
  MIN_PACK_QUANTITY,
} from "@/lib/packing";
import {
  MinusGlyph,
  PlusGlyph,
  tickBoxBase,
} from "@/components/packing-glyphs";

export function PackingQuantity({
  quantity,
  label,
  packed,
  step,
}: {
  quantity: number;
  label: string;
  packed: boolean;
  step: (formData: FormData) => Promise<void>;
}) {
  // The reducer form, not an absolute set: two clicks before the first render
  // commits both close over the same `shown`, so setting a value would show one
  // step where the SQL has applied two.
  const [shown, stepShown] = useOptimistic(quantity, (n: number, delta: number) =>
    clampPackQuantity(n + delta),
  );

  return (
    <>
      {/* The count sits ahead of the label and shows even at one, so a row
          never changes shape as you step it. */}
      <span
        className={cx("min-w-0 flex-1 truncate text-sm", packed && "text-ink-soft")}
      >
        <span className="font-mono tabular-nums text-ink-faint">{shown}</span>
        <span className="text-ink-faint">{" — "}</span>
        {label}
      </span>

      <form
        action={async (formData: FormData) => {
          stepShown(Number(formData.get("step")));
          await step(formData);
        }}
        className="flex shrink-0 items-center gap-0.5"
      >
        <StepButton
          value="-1"
          label={`One fewer ${label}`}
          disabled={shown <= MIN_PACK_QUANTITY}
        >
          <MinusGlyph />
        </StepButton>
        <StepButton
          value="1"
          label={`One more ${label}`}
          disabled={shown >= MAX_PACK_QUANTITY}
        >
          <PlusGlyph />
        </StepButton>
      </form>
    </>
  );
}

/** Both step buttons submit the same form, so the value rides on the button. */
function StepButton({
  value,
  label,
  disabled,
  children,
}: {
  value: string;
  label: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      name="step"
      value={value}
      disabled={disabled}
      aria-label={label}
      className={cx(
        tickBoxBase,
        "border-transparent text-ink-faint transition-colors hover:bg-sheet-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint",
      )}
    >
      {children}
    </button>
  );
}
