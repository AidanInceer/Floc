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
 * A one-of-N choice as a row of pills instead of a dropdown (ticket 201
 * follow-up). Every option is on screen, so the rings can be compared rather
 * than opened one at a time — and it stays plain radio inputs, so the form
 * posts exactly what a `<select>` did and it works without JavaScript.
 */
const pillShape =
  "lift block rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em]";
const pillOff = "border-rule bg-sheet-2 text-ink-soft";

export function PillChoice<T extends string>({
  name,
  label,
  hint,
  value,
  options,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  value: T;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="typed mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={o.value === value}
              className="peer sr-only"
            />
            <span
              className={cx(
                pillShape,
                pillOff,
                "peer-checked:border-pen peer-checked:bg-pen peer-checked:text-sheet peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pen",
              )}
            >
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {hint ? <p className="mt-2 text-xs text-ink-faint">{hint}</p> : null}
    </fieldset>
  );
}
