/**
 * The two bars above a packing list (ticket 229): how it's ordered and filtered,
 * and the two ways to clear it.
 *
 * Both are plain links and plain forms, no client state. Sort and filter live in
 * the URL so a view can be shared and the back button undoes it; selection is a
 * native checkbox group, associated to the bulk form by id because a row already
 * carries its own forms and HTML has no nested forms.
 */
import Link from "next/link";

import { cx } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { pillOff, pillOn, pillShape } from "@/components/account-ui";
import {
  PACK_CATEGORIES,
  PACK_CATEGORY_LABELS,
  PACK_SORT_LABELS,
} from "@/lib/packing";
import type { PackCategory, PackSort } from "@/lib/packing";

/** Every pill on this page is a link, so the shape comes from `account-ui` and only the element changes. */
function Pill({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={on ? "true" : undefined}
      className={cx(
        pillShape,
        on ? pillOn : pillOff,
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen",
      )}
    >
      {children}
    </Link>
  );
}

export function PackingListFilters({
  hrefFor,
  sort,
  category,
  sorts,
}: {
  /** Builds the URL for one changed control, keeping every other one as it is. */
  hrefFor: (patch: { sort?: PackSort; category?: PackCategory | "all" }) => string;
  sort: PackSort;
  category: PackCategory | "all";
  /** `quantity` is left out for the shared list, which shows no count to sort by. */
  sorts: readonly PackSort[];
}) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          Sort
        </span>
        {sorts.map((s) => (
          <Pill key={s} href={hrefFor({ sort: s })} on={s === sort}>
            {PACK_SORT_LABELS[s]}
          </Pill>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          Show
        </span>
        <Pill href={hrefFor({ category: "all" })} on={category === "all"}>
          All
        </Pill>
        {PACK_CATEGORIES.map((c) => (
          <Pill key={c} href={hrefFor({ category: c })} on={c === category}>
            {PACK_CATEGORY_LABELS[c]}
          </Pill>
        ))}
      </div>
    </div>
  );
}

/**
 * Remove-what's-ticked and clear-the-lot. Both confirm first: one is
 * undoable only by retyping the rows, the other by retyping all of them.
 */
export function PackingBulkBar({
  formId,
  removeSelected,
  reset,
  resetMessage,
}: {
  formId: string;
  removeSelected: (formData: FormData) => Promise<void>;
  reset: () => Promise<void>;
  resetMessage: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <form id={formId} action={removeSelected}>
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          label="Remove the ticked lines"
          message="Remove every line you've ticked?"
          confirmLabel="Remove them"
          className="!px-3"
        >
          Remove ticked
        </ConfirmSubmit>
      </form>

      <form action={reset}>
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          label="Clear the whole list"
          message={resetMessage}
          confirmLabel="Clear it"
          className="!px-3 !text-red"
        >
          Clear list
        </ConfirmSubmit>
      </form>
    </div>
  );
}

/** The category picker beside an add box — the one place a hand-typed row gets filed. */
export function CategorySelect({ defaultValue }: { defaultValue?: PackCategory }) {
  return (
    <label>
      <span className="sr-only">Category</span>
      <select
        name="category"
        defaultValue={defaultValue ?? "other"}
        className="rounded-md border border-rule-strong bg-sheet px-3 py-2.5 text-sm"
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
