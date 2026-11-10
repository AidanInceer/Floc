/**
 * The shape shared by the four account surfaces — your profile, someone
 * else's, settings and friends (ticket 201). One column of white panels on the
 * canvas, so all four read as the same room rather than four rooms.
 */
import type { ReactNode } from "react";

import { cx, PageTitle } from "@/components/system/ui";
import "./account-ui.css";

export function AccountPage({
  eyebrow,
  title,
  blurb,
  actions,
  titleInBar,
  wide,
  children,
}: {
  eyebrow?: string;
  title: string;
  blurb?: ReactNode;
  actions?: ReactNode;
  /** The account bar under the header already names the page, so the title is for screen readers only. */
  titleInBar?: boolean;
  /** Your own profile: on a wide screen the column opens to the page's width so the globe can fill it. */
  wide?: boolean;
  children: ReactNode;
}) {
  if (titleInBar) {
    return (
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
        <div className={cx("mx-auto flex max-w-[54rem] flex-col gap-4", wide && "lg:max-w-none")}>
          <PageTitle className="sr-only">{title}</PageTitle>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <div className="mx-auto max-w-[54rem]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? <p className="typed">{eyebrow}</p> : null}
            <PageTitle className="mt-2">{title}</PageTitle>
            {blurb ? (
              <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">{blurb}</p>
            ) : null}
          </div>
          {actions}
        </header>
        <div className="mt-8 flex flex-col gap-4">{children}</div>
      </div>
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
    <section className={cx("rounded-md bg-sheet p-6", className)}>
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
        "flex flex-wrap items-center justify-between gap-3 rounded-sm bg-sheet-2 px-3 py-2.5",
        className,
      )}
    >
      {children}
    </li>
  );
}

/**
 * An on/off setting as a labelled row with a switch (ticket 235).
 * A real checkbox underneath, so the form still posts without JavaScript.
 */
export function ToggleRow({
  name,
  label,
  hint,
  value,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  /** Set when several rows share one `name` and post as a set. */
  value?: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    // Why: the switch leads its words. At the far end of a wide panel it read
    // as belonging to whichever row the eye landed on.
    <label className={cx("flex items-start gap-3", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="peer sr-only"
      />
      <span className="switch-track" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>
        ) : null}
      </span>
    </label>
  );
}
