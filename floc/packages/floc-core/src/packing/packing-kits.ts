import { clampPackQuantity } from "./packing";
import type { PackCategory } from "./packing";

export type KitItem = {
  label: string;
  category: PackCategory;
  quantity: number;
};

function key(label: string): string {
  return label.trim().toLowerCase();
}

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
