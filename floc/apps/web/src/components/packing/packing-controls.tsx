import Link from "next/link";

import { cx, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { ConfirmSubmit, Menu } from "@/components/system/client-ui";
import { CrossIcon } from "@/components/system/icons";
import {
  PACK_CATEGORIES,
  PACK_CATEGORY_LABELS,
} from "@floc/core/packing/packing";
import type { PackCategory } from "@floc/core/packing/packing";

/**
 * Clearing, in two steps rather than one (ticket 229). The tick boxes used to
 * sit on every row all the time with two verbs under them, and nothing said the
 * two were connected. Now the list reads clean until you press "Pick rows",
 * which is also what puts the boxes on screen — the mode and the thing it does
 * arrive together.
 */
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
  /** Whether the tick boxes are on screen — the URL says so, not client state. */
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

/** The category picker beside an add box — the one place a hand-typed row gets filed. */
export function CategorySelect({ defaultValue }: { defaultValue?: PackCategory }) {
  return (
    <label className="shrink-0">
      <span className="sr-only">Category</span>
      <select
        name="category"
        defaultValue={defaultValue ?? "other"}
        className="h-full rounded-sm border border-rule-strong bg-sheet px-2 py-2.5 text-sm sm:px-3"
      >
        {PACK_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {PACK_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Your bag's other verbs behind one … beside Fill your bag (E2,
 * wireframe/packing-bag-top): one visible action in the head. "Remove
 * suggested" (#469) is free, so a member whose Pro lapsed can still undo it.
 */
export function PackingBagMore({
  reset,
  suggested,
}: {
  reset: (() => Promise<void>) | null;
  suggested: { count: number; remove: () => Promise<void> };
}) {
  if (!reset && suggested.count === 0) return null;
  return (
    <Menu label="More for your bag">
      {suggested.count > 0 ? (
        <form action={suggested.remove}>
          <button type="submit" role="menuitem" className={menuItemClass}>
            Remove suggested <span className="font-mono text-[11px] tabular-nums text-ink-faint">{suggested.count}</span>
          </button>
        </form>
      ) : null}
      {reset ? (
        <form action={reset}>
          <ConfirmSubmit
            variant="ghost"
            confirmVariant="danger"
            message="Clear your whole bag? The shared list stays."
            confirmLabel="Clear it"
            className={menuDangerItemClass}
          >
            Clear your bag
          </ConfirmSubmit>
        </form>
      ) : null}
    </Menu>
  );
}
