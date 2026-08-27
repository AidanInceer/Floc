import { cx } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { CrossGlyph, squareButton } from "@/components/packing-glyphs";
import { PackingQuantity } from "@/components/packing-quantity";

/**
 * One thing in a saved list (ticket 230). The same row as a bag's, minus the
 * two things a saved list has no answer for: nothing here is packed, so there
 * is no tick and no status. The category isn't printed either — the strip the
 * row sits under already says it.
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
  return (
    <li className="flex min-h-12 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
      <PackingQuantity
        quantity={quantity}
        label={label}
        packed={false}
        step={step.bind(null, itemId)}
      />

      <form action={remove.bind(null, itemId)}>
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
