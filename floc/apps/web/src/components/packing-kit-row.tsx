"use client";

import { useOptimistic } from "react";

import { cx } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { CrossGlyph, squareButton } from "@/components/packing-glyphs";
import { PackingStepper } from "@/components/packing-quantity";
import { clampPackQuantity } from "@/lib/packing";

/**
 * One thing in a saved list (ticket 230). The same row as a bag's, minus the
 * two things a saved list has no answer for: nothing here is packed, so there
 * is no tick and no status. The category isn't printed either — the strip the
 * row sits under already says it.
 *
 * A Client Component for the same reason the bag's row is (ticket 231): the
 * write revalidates the whole page, and a count that waits for that reads as a
 * dead button.
 */
export function PackingKitRow({
  itemId,
  label,
  quantity,
  step,
  remove,
}: {
  itemId: number;
  label: string;
  quantity: number;
  step: (itemId: number, formData: FormData) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
}) {
  const [shown, stepShown] = useOptimistic(quantity, (n: number, delta: number) =>
    clampPackQuantity(n + delta),
  );
  const [gone, showGone] = useOptimistic<boolean, void>(false, () => true);

  if (gone) return null;

  return (
    <li className="flex min-h-12 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-mono tabular-nums text-ink-faint">{shown}</span>
        <span className="text-ink-faint">{" — "}</span>
        {label}
      </span>

      <PackingStepper
        shown={shown}
        label={label}
        onStep={stepShown}
        step={step.bind(null, itemId)}
      />

      <form
        action={async () => {
          showGone();
          await remove(itemId);
        }}
      >
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          label={`Remove ${label}`}
          message={`Remove "${label}" from this list?`}
          confirmLabel="Remove it"
          className={cx(
            squareButton,
            "!text-ink-faint hover:!bg-red-soft hover:!text-red",
          )}
        >
          <CrossGlyph />
        </ConfirmSubmit>
      </form>
    </li>
  );
}
