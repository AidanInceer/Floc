"use client";

import { useOptimistic } from "react";

import { Badge, cx } from "@/components/system/ui";
import { clampPackQuantity } from "@floc/core/packing/packing";
import { ConfirmSubmit } from "@/components/system/client-ui";
import { InlineRename } from "@/components/system/inline-rename";
import { TEXT_CAPS } from "@floc/core/text/text";
import {
  CheckGlyph,
  CrossGlyph,
  SelectLineBox,
  squareButton,
  tickBoxBase,
  tickBoxClass,
} from "@/components/packing/packing-glyphs";
import { PackingStepper } from "@/components/packing/packing-quantity";

/**
 * One thing in your own bag (ticket 220). A separate component from
 * `PackingLineRow` rather than a mode of it: nobody claims your socks, so the
 * claim verb, the avatars and the three-way status all go, and what is left is
 * a plain checklist row with a count on it.
 *
 * A Client Component so the tick and the removal land under the finger. Every
 * write here revalidates the whole tab — both lists, the roster, the forecast —
 * and a row that sits inert until all of that returns reads as a dead control.
 * The optimistic value is overwritten by the server's, so a refused write
 * corrects itself rather than sticking.
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
  rename,
}: {
  tripId: number;
  lineId: number;
  label: string;
  /** The bulk-remove form this row's select box belongs to, or null when not selecting (ticket 229). */
  selectFormId: string | null;
  quantity: number;
  packedAt: Date | null;
  setPacked: (tripId: number, lineId: number, packed: boolean) => Promise<void>;
  step: (tripId: number, lineId: number, formData: FormData) => Promise<void>;
  remove: (tripId: number, lineId: number) => Promise<void>;
  rename: (tripId: number, lineId: number, label: string) => Promise<{ error?: string }>;
}) {
  const [packed, showPacked] = useOptimistic(packedAt !== null);
  // A reducer, not a set value: two clicks before the first render commits both
  // close over the same count, so setting one would show a single step where the
  // SQL has applied two.
  const [shown, stepShown] = useOptimistic(quantity, (n: number, delta: number) =>
    clampPackQuantity(n + delta),
  );
  const [gone, showGone] = useOptimistic<boolean, void>(false, () => true);

  // The row goes before the delete lands, and the re-render that lands drops it
  // for real. Nothing to fade: a confirmed removal is already deliberate.
  if (gone) return null;

  return (
    <li className="flex min-h-12 items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-4">
      <SelectLineBox formId={selectFormId} lineId={lineId} label={label} />

      <form
        action={async () => {
          showPacked(!packed);
          await setPacked(tripId, lineId, !packed);
        }}
      >
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
        className={cx("flex min-w-0 flex-1 items-baseline whitespace-pre text-sm", packed && "text-ink-soft")}
      >
        <span className="font-mono tabular-nums text-ink-faint">{shown}</span>
        <span className="text-ink-faint">{" — "}</span>
        <InlineRename
          value={label}
          label={`Rename ${label}`}
          maxLength={TEXT_CAPS.packingLabel}
          save={(next) => rename(tripId, lineId, next)}
        />
      </span>

      <span className="hidden shrink-0 sm:block">
        <Badge tone={packed ? "agreed" : "open"} className="whitespace-nowrap">
          {packed ? "Packed" : "Not packed"}
        </Badge>
      </span>

      <PackingStepper
        shown={shown}
        label={label}
        onStep={stepShown}
        step={step.bind(null, tripId, lineId)}
      />

      <form
        action={async () => {
          showGone();
          await remove(tripId, lineId);
        }}
      >
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
