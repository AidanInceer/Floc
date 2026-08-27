/**
 * The frame a packing list sits in (ticket 229). One bordered object with a
 * tinted header, its add box inside the frame and its rows running flush to the
 * edges — the section was five stacked strips that all looked equally
 * important, and nothing said where it began or ended.
 *
 * Collapsing is `<details>`, not state: two lists and a dozen categories on one
 * page is a lot to scroll past, and a native disclosure keeps that working with
 * no client bundle, no hydration and the browser's own keyboard handling.
 *
 * Every slot is a node rather than data: the two lists share this shape but
 * almost none of their contents, and a component taking both lists' props would
 * be two components wearing one name.
 */
import { cx } from "@/components/ui";
import { DisclosureGlyph } from "@/components/packing-glyphs";

const summaryBase =
  "flex cursor-pointer list-none items-center gap-x-4 gap-y-2 [&::-webkit-details-marker]:hidden";

export function PackingCard({
  header,
  tools,
  footer,
  children,
}: {
  /** Title, the one-line count, and the view controls. */
  header: React.ReactNode;
  /** The add box, and anything that acts on the list as a whole. */
  tools: React.ReactNode;
  /** The two clearing verbs. Absent when there's nothing on screen to clear. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details
      open
      className="group/card mt-8 overflow-hidden rounded-xl border border-rule bg-sheet"
    >
      <summary
        className={cx(
          summaryBase,
          "flex-wrap border-b border-rule bg-sheet-2 px-4 py-3",
        )}
      >
        <span className="shrink-0 text-ink-faint transition-transform group-open/card:rotate-90">
          <DisclosureGlyph />
        </span>
        {header}
      </summary>

      <div className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3">
        {tools}
      </div>

      {children}

      {footer ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-rule bg-sheet-2 px-4 py-2.5">
          {footer}
        </div>
      ) : null}
    </details>
  );
}

/** The count, said only where it's true — a bag with nothing packed doesn't mention packing. */
export function PackingCount({
  total,
  packed,
}: {
  total: number;
  packed: number;
}) {
  if (total === 0) return null;
  return (
    <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
      {total === 1 ? "1 thing" : `${total} things`}
      {packed > 0 ? ` · ${packed} packed` : null}
    </span>
  );
}

/**
 * One heading's rows. The heading is a tinted strip rather than floating text,
 * which is what makes the grouping visible now the list is one continuous
 * surface. Null means the list is flat — see `viewPackingLines`.
 */
export function PackingGroup({
  heading,
  count,
  pinned,
  children,
}: {
  heading: string | null;
  count: number;
  /**
   * Held open, because a folded group keeps its rows in the DOM and their tick
   * boxes post with the rest — collapsing one mid-selection would remove rows
   * you can no longer see.
   */
  pinned: boolean;
  children: React.ReactNode;
}) {
  if (!heading) return <ul className="divide-y divide-rule">{children}</ul>;

  const title = (
    <>
      <span>{heading}</span>
      <span className="tabular-nums">{count}</span>
    </>
  );

  if (pinned) {
    return (
      <div>
        <h3 className={cx(headingStrip, "flex items-center gap-4 pl-4")}>
          {title}
        </h3>
        <ul className="divide-y divide-rule">{children}</ul>
      </div>
    );
  }

  return (
    <details open className="group/group">
      <summary className={cx(summaryBase, headingStrip)}>
        <span className="shrink-0 transition-transform group-open/group:rotate-90">
          <DisclosureGlyph />
        </span>
        {title}
      </summary>
      <ul className="divide-y divide-rule">{children}</ul>
    </details>
  );
}

const headingStrip =
  "border-b border-rule bg-sheet-2 px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint";

/** Nothing to show, inside the frame rather than replacing it. */
export function PackingCardEmpty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm text-ink">{title}</p>
      {children ? (
        <p className="mx-auto mt-1 max-w-prose text-sm text-ink-soft">{children}</p>
      ) : null}
    </div>
  );
}

/** The tier, as one setting with three positions rather than three loose buttons. */
export function SegmentedField({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center rounded-full border border-rule-strong bg-sheet p-0.5">
      {children}
    </div>
  );
}

export const segmentOn = "bg-pen text-sheet";
export const segmentOff = "text-ink-soft hover:bg-sheet-2 hover:text-ink";
export const segmentShape =
  "rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] transition-colors";
