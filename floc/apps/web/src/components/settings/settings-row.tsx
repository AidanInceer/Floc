/**
 * One Settings section as a row that opens in place (F3c). A native
 * `<details>`, so rows open and close with no JavaScript and several can be
 * open at once. Closed, the row shows its answer; open, it shows its controls.
 */
import type { ReactNode } from "react";

import { ChevronIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

export function SettingsSheet({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-md bg-sheet">{children}</div>;
}

export function SettingsRow({
  id,
  title,
  summary,
  open,
  danger,
  aside,
  children,
}: {
  id: string;
  title: string;
  summary?: string;
  open?: boolean;
  danger?: boolean;
  /** Shown on the closed row only, beside the chevron. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      open={open}
      className={cx("group/row relative border-t border-rule first:border-t-0", danger && "open:bg-red-soft")}
    >
      <summary
        className={cx(
          "flex cursor-pointer list-none items-center gap-3 px-[18px] py-3.5 transition-colors duration-220 ease-(--ease) [&::-webkit-details-marker]:hidden",
          danger ? "hover:bg-red-soft" : "hover:bg-pen-soft group-open/row:hover:bg-transparent",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className={cx("block text-[15px] font-medium group-open/row:font-semibold", danger && "text-red")}>
            {title}
          </span>
          {summary ? (
            <span className="block truncate text-[13px] text-ink-faint group-open/row:hidden">{summary}</span>
          ) : null}
        </span>
        {aside ? <span className="group-open/row:hidden">{aside}</span> : null}
        <ChevronIcon direction="down" className="text-ink-faint transition-transform duration-220 ease-(--ease) group-open/row:rotate-180" />
      </summary>
      <div className="flex flex-col gap-5 px-[18px] pb-6 pt-0.5">{children}</div>
    </details>
  );
}
