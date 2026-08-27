import type { ReactNode } from "react";

import { Badge, cx } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { MAX_PACK_QUANTITY, MIN_PACK_QUANTITY } from "@/lib/packing";
import {
  CheckGlyph,
  CrossGlyph,
  MinusGlyph,
  PlusGlyph,
  SelectLineBox,
  squareButton,
  tickBoxBase,
  tickBoxClass,
} from "@/components/packing-glyphs";

/**
 * One thing in your own bag (ticket 220). A separate component from
 * `PackingLineRow` rather than a mode of it: nobody claims your socks, so the
 * claim verb, the avatars and the three-way status all go, and what is left is
 * a plain checklist row with a count on it.
 */
export function PersonalPackingRow({
  tripId,
  lineId,
  label,
  selectFormId,
  quantity,
  packedAt,
  setPacked,
  step,
  remove,
}: {
  tripId: number;
  lineId: number;
  label: string;
  /** The bulk-remove form this row's select box belongs to (ticket 229). */
  selectFormId: string;
  quantity: number;
  packedAt: Date | null;
  setPacked: (tripId: number, lineId: number, packed: boolean) => Promise<void>;
  step: (tripId: number, lineId: number, formData: FormData) => Promise<void>;
  remove: (tripId: number, lineId: number) => Promise<void>;
}) {
  const packed = packedAt !== null;

  return (
    <li className="flex min-h-12 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
      <SelectLineBox formId={selectFormId} lineId={lineId} label={label} />

      <form action={setPacked.bind(null, tripId, lineId, !packed)}>
        <button
          type="submit"
          aria-label={packed ? `Unpack ${label}` : `Mark ${label} packed`}
          className={cx(tickBoxBase, tickBoxClass(packed))}
        >
          <CheckGlyph />
        </button>
      </form>

      {/* The count sits ahead of the label and shows even at one, so a row
          never changes shape as you step it. */}
      <span
        className={cx("min-w-0 flex-1 truncate text-sm", packed && "text-ink-soft")}
      >
        <span className="font-mono tabular-nums text-ink-faint">
          {quantity}
        </span>
        <span className="text-ink-faint">{" — "}</span>
        {label}
      </span>

      <form
        action={step.bind(null, tripId, lineId)}
        className="flex shrink-0 items-center gap-0.5"
      >
        <StepButton
          value="-1"
          label={`One fewer ${label}`}
          disabled={quantity <= MIN_PACK_QUANTITY}
        >
          <MinusGlyph />
        </StepButton>
        <StepButton
          value="1"
          label={`One more ${label}`}
          disabled={quantity >= MAX_PACK_QUANTITY}
        >
          <PlusGlyph />
        </StepButton>
      </form>

      <Badge
        tone={packed ? "agreed" : "open"}
        className="shrink-0 whitespace-nowrap"
      >
        {packed ? "Packed" : "Not packed"}
      </Badge>

      <form action={remove.bind(null, tripId, lineId)}>
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          label={`Remove ${label}`}
          message={`Remove "${label}" from your bag?`}
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
  children: ReactNode;
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
