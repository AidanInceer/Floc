/**
 * The shape shared by the four account surfaces — your profile, someone
 * else's, settings and friends (ticket 201). One column of white panels on the
 * canvas, so all four read as the same room rather than four rooms.
 */
import type { ReactNode } from "react";

import { cx } from "@/components/ui";

export function AccountPage({
  eyebrow,
  title,
  blurb,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  blurb?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[54rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="typed">{eyebrow}</p> : null}
          <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.5rem)]">{title}</h1>
          {blurb ? (
            <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">{blurb}</p>
          ) : null}
        </div>
        {actions}
      </header>
      <div className="mt-8 flex flex-col gap-4">{children}</div>
    </div>
  );
}

/** One thing you can change, or one thing you can look at. */
export function Panel({
  title,
  hint,
  aside,
  children,
  className,
}: {
  title?: string;
  hint?: ReactNode;
  /** Sits opposite the title — a badge, a count, one control. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-lg bg-sheet p-6", className)}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            {hint ? (
              <p className="mt-1 max-w-[62ch] text-sm text-ink-soft">{hint}</p>
            ) : null}
          </div>
          {aside}
        </div>
      ) : null}
      <div className={title ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}

/**
 * A panel that is nothing but rows — one setting per line, its current value
 * on the right (ticket 236). The value *is* the description, so none of these
 * rows carries a hint.
 */
export function RowList({ children }: { children: ReactNode }) {
  return (
    // `overflow-anchor` off: scroll anchoring holds the content *below* an
    // opening row still, which reads as the page growing upwards (ticket 236).
    <section className="overflow-hidden rounded-lg bg-sheet [overflow-anchor:none]">
      <div className="divide-y divide-rule">{children}</div>
    </section>
  );
}

/**
 * One `RowList` line: the setting, its current value, and its editor folded
 * underneath. Native `<details>` — the fold needs no JavaScript and no state,
 * and the editor opens where the row is rather than over the page.
 */
export function SettingRow({
  label,
  value,
  children,
}: {
  label: string;
  value: ReactNode;
  children: ReactNode;
}) {
  return (
    <details>
      <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-sheet-2 [&::-webkit-details-marker]:hidden">
        <span className="text-sm">{label}</span>
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
          <span className="setting-row-value truncate">{value}</span>
          <svg
            width={13}
            height={13}
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="setting-row-chevron shrink-0 text-ink-faint"
            aria-hidden
          >
            <path d="M5.5 3l4 4-4 4" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-rule bg-sheet-2 px-6 py-5">{children}</div>
    </details>
  );
}

/** A row of people, the same on friends lists and on a profile. */
export function PersonRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cx(
        "flex flex-wrap items-center justify-between gap-3 rounded-md bg-sheet-2 px-3 py-2.5",
        className,
      )}
    >
      {children}
    </li>
  );
}

/**
 * A one-of-N choice as a pill group (ticket 201 follow-up; matched to the nav
 * bar's own pills by 235, so a choice looks the same wherever it is made).
 * Every option is on screen, so the rings can be compared rather than opened
 * one at a time — and it stays plain radio inputs, so the form posts exactly
 * what a `<select>` did and it works without JavaScript.
 *
 * The chosen pill is inked as well as filled, so the state is never carried by
 * colour alone.
 */
const pillShape =
  "block cursor-pointer rounded-full px-4 py-1.5 text-center text-sm font-medium transition-colors";
const pillOff = "text-ink-soft hover:bg-sheet hover:text-ink";
const pillOn =
  "peer-checked:bg-ink peer-checked:text-sheet peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pen";

export function PillChoice<T extends string>({
  name,
  label,
  hint,
  value,
  options,
  className,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  value: T;
  options: { value: T; label: string }[];
  className?: string;
}) {
  // `role`/`aria-labelledby` rather than fieldset/legend: a legend can't be a
  // flex item, and the label has to sit beside the pills, not above them.
  const labelId = `${name}-label`;
  return (
    <div className={cx("min-w-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span id={labelId} className="typed">
          {label}
        </span>
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="flex max-w-full flex-wrap items-center gap-1 rounded-full bg-sheet-3 p-1"
        >
          {options.map((o) => (
            <label key={o.value} className="min-w-0">
              <input
                type="radio"
                name={name}
                value={o.value}
                defaultChecked={o.value === value}
                className="peer sr-only"
              />
              <span className={cx(pillShape, pillOff, pillOn)}>{o.label}</span>
            </label>
          ))}
        </div>
      </div>
      {hint ? <p className="mt-2 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}

/**
 * An on/off setting as a labelled row with a switch (ticket 235) — the same
 * shape as a `SettingRow`, so a pane of switches and a pane of folds read as
 * one page. A real checkbox underneath, so the form still posts without
 * JavaScript.
 */
export function ToggleRow({
  name,
  label,
  hint,
  value,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  /** Set when several rows share one `name` and post as a set. */
  value?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="switch-track" aria-hidden />
    </label>
  );
}
