"use client";

/**
 * Re-filing one document (ticket 239). The category chip *is* the trigger —
 * clicking what a row says is the shortest route to changing it, and the row
 * has no room for a separate control.
 *
 * Each item is its own submit, so picking a heading is the whole interaction
 * and there is nothing left for a Save button (the shape `setTripPackTier`
 * uses on Packing).
 */
import { setCategory } from "@/app/trip/[id]/files/actions";
import { CategoryChip } from "@/components/document-row";
import { Menu } from "@/components/client-ui";
import { menuItemClass } from "@/components/ui";
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS } from "@/lib/documents";
import type { DocCategory } from "@/lib/documents";

export function DocumentFiling({
  tripId,
  documentId,
  category,
}: {
  tripId: number;
  documentId: number;
  category: DocCategory;
}) {
  return (
    <Menu
      label="File this under"
      align="right"
      triggerClassName="!border-none !bg-transparent !p-0"
      trigger={<CategoryChip category={category} />}
    >
      <form action={setCategory.bind(null, tripId, documentId)}>
        {DOC_CATEGORIES.map((c) => (
          <button
            key={c}
            type="submit"
            name="category"
            value={c}
            aria-current={c === category}
            className={menuItemClass}
          >
            {DOC_CATEGORY_LABELS[c]}
          </button>
        ))}
      </form>
    </Menu>
  );
}
