import Link from "next/link";

import { Select, cx } from "@/components/system/ui";
import { ConfirmSubmit } from "@/components/system/client-ui";
import { CrossIcon } from "@/components/system/icons";
import {
  PACK_CATEGORIES,
  PACK_CATEGORY_LABELS,
} from "@floc/core/packing/packing";
import type { PackCategory } from "@floc/core/packing/packing";

export function PackingBulkBar({
  formId,
  selecting,
  selectHref,
  doneHref,
  removeSelected,
  reset,
  resetMessage,
}: {
  formId: string;
  selecting: boolean;
  selectHref: string;
  doneHref: string;
  removeSelected: (formData: FormData) => Promise<void>;
  reset: () => Promise<void>;
  resetMessage: string;
}) {
  if (!selecting) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link href={selectHref} className={cx(bulkVerb, "text-pen")}>
          Pick rows to remove
        </Link>
        <form action={reset}>
          <ConfirmSubmit
            variant="ghost"
            confirmVariant="danger"
            label="Clear the whole list"
            message={resetMessage}
            confirmLabel="Clear it"
            className="!px-3 !text-red hover:!bg-red-soft hover:!text-red"
          >
            Clear list
          </ConfirmSubmit>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form id={formId} action={removeSelected}>
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          label="Remove the ticked lines"
          message="Remove every line you've ticked?"
          confirmLabel="Remove them"
          className="!px-3 !text-red hover:!bg-red-soft hover:!text-red"
        >
          <CrossIcon size={11} />
          Remove ticked
        </ConfirmSubmit>
      </form>
      <Link href={doneHref} className={cx(bulkVerb, "text-ink-soft")}>
        Done
      </Link>
    </div>
  );
}

const bulkVerb =
  "rounded-sm px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] hover:bg-sheet";

export function CategorySelect({ defaultValue }: { defaultValue?: PackCategory }) {
  return (
    <label className="shrink-0">
      <span className="sr-only">Category</span>
      <Select
        name="category"
        defaultValue={defaultValue ?? "other"}
        className="h-[31px] w-auto"
      >
        {PACK_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {PACK_CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
    </label>
  );
}
