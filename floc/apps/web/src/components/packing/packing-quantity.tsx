"use client";

import { cx } from "@/components/system/ui";
import { MAX_PACK_QUANTITY, MIN_PACK_QUANTITY } from "@floc/core/packing/packing";
import { tickBoxBase } from "@/components/packing/packing-glyphs";
import { MinusIcon, PlusIcon } from "@/components/system/icons";

export function PackingStepper({
  shown,
  label,
  onStep,
  step,
}: {
  shown: number;
  label: string;
  onStep: (delta: number) => void;
  step: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        onStep(Number(formData.get("step")));
        await step(formData);
      }}
      className="flex shrink-0 items-center gap-0.5"
    >
      <StepButton
        value="-1"
        label={`One fewer ${label}`}
        disabled={shown <= MIN_PACK_QUANTITY}
      >
        <MinusIcon />
      </StepButton>
      <StepButton
        value="1"
        label={`One more ${label}`}
        disabled={shown >= MAX_PACK_QUANTITY}
      >
        <PlusIcon />
      </StepButton>
    </form>
  );
}

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
