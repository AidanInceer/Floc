/**
 * Applying a saved list to a bag (ticket 230). Pure, because the rule — what
 * counts as "already in the bag" — is the whole decision and belongs where it
 * can be read and tested, not inside a query.
 */
import { clampPackQuantity } from "@/lib/packing";
import type { PackCategory } from "@/lib/packing";

export type KitItem = {
  label: string;
  category: PackCategory;
  quantity: number;
};

/** Two rows are the same thing if they read the same — "Tripod" and "tripod" are one tripod. */
function key(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * What applying a saved list should actually add. Additive and idempotent: a
 * label already in the bag is left exactly as it is, count and all, because
 * pressing the button twice must not quietly double a row you had tuned. A kit
 * that repeats a label inside itself only lands once for the same reason.
 */
export function kitItemsToAdd(
  items: KitItem[],
  existing: { label: string }[],
): KitItem[] {
  const seen = new Set(existing.map((l) => key(l.label)));
  const out: KitItem[] = [];
  for (const item of items) {
    const k = key(item.label);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ ...item, quantity: clampPackQuantity(item.quantity) });
  }
  return out;
}
