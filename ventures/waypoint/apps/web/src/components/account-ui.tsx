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
  eyebrow: string;
  title: string;
  blurb?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[54rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="typed">{eyebrow}</p>
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
