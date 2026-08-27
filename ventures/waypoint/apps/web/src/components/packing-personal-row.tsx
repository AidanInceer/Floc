import { Badge, cx } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import {
  CheckGlyph,
  CrossGlyph,
  SelectLineBox,
  squareButton,
  tickBoxBase,
  tickBoxClass,
} from "@/components/packing-glyphs";
import { PackingQuantity } from "@/components/packing-quantity";

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
  /** The bulk-remove form this row's select box belongs to, or null when not selecting (ticket 229). */
  selectFormId: string | null;
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

      <PackingQuantity
        quantity={quantity}
        label={label}
        packed={packed}
        step={step.bind(null, tripId, lineId)}
      />

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
