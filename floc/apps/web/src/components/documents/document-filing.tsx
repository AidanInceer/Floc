"use client";

import { setCategory } from "@/app/trip/[id]/files/actions";
import { CategoryChip } from "@/components/documents/document-row";
import { Menu } from "@/components/system/client-ui";
import { menuItemClass } from "@/components/system/ui";
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS } from "@floc/core/documents/documents";
import type { DocCategory } from "@floc/core/documents/documents";

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
