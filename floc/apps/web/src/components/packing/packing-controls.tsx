import Link from "next/link";

import { cx, menuItemClass } from "@/components/system/ui";
import { ConfirmSubmit, Menu, SubmitButton } from "@/components/system/client-ui";
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
      <span className="text-sm text-ink-soft">
        Tick the rows you want gone.
      </span>
      <form id={formId} action={removeSelected}>
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          label="Remove the ticked lines"
          message="Remove every line you've ticked?"
          confirmLabel="Remove them"
          className="!px-3 !text-red hover:!bg-red-soft hover:!text-red"
        >
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
  "rounded-full px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] hover:bg-sheet";

/** The category picker beside an add box — the one place a hand-typed row gets filed. */
export function CategorySelect({ defaultValue }: { defaultValue?: PackCategory }) {
  return (
    <label className="shrink-0">
      <span className="sr-only">Category</span>
      <select
        name="category"
        defaultValue={defaultValue ?? "other"}
        className="rounded-md border border-rule-strong bg-sheet px-2 py-2.5 text-sm sm:px-3"
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
 * Copy one of your saved lists into this bag (ticket 230). A menu rather than
 * a row of buttons: it is one press you make at the start of a trip and then
 * never again, so it sits closed until asked. The last item is the way to make
 * one, which is also the whole empty state.
 */
export function PackingKitMenu({
  kits,
  apply,
}: {
  kits: { id: number; name: string; itemCount: number }[];
  apply: (kitId: number) => Promise<void>;
}) {
  return (
    <Menu
      label="Add a saved list"
      trigger={
        <>
          <span className="sm:hidden">Lists</span>
          <span className="hidden sm:inline">Saved lists</span>
        </>
      }
      triggerClassName="shrink-0 whitespace-nowrap rounded-full border border-rule-strong bg-sheet px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] hover:bg-sheet-2 data-[open=true]:bg-sheet-2"
    >
      {kits.map((kit) => (
        <form key={kit.id} action={apply.bind(null, kit.id)}>
          <SubmitButton
            variant="ghost"
            pendingLabel="Adding…"
            className={cx(menuItemClass, "w-full !justify-start")}
          >
            {kit.name}
            <span className="ml-2 font-mono text-[10.5px] tabular-nums text-ink-faint">
              {kit.itemCount}
            </span>
          </SubmitButton>
        </form>
      ))}
      {kits.length > 0 ? (
        <div className="my-1 border-t border-dotted border-rule-strong" />
      ) : null}
      <Link role="menuitem" href="/packing-lists" className={menuItemClass}>
        {kits.length > 0 ? "Manage your lists" : "Make your first list"}
      </Link>
    </Menu>
  );
}
