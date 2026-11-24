import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";

export function AuthShell({
  eyebrow,
  title,
  blurb,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  blurb?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[27rem] px-4 pb-20 pt-12 sm:px-6">
      <header className="text-center">
        {eyebrow ? <p className="typed">{eyebrow}</p> : null}
        <h1 className={cx(eyebrow && "mt-3", "break-words text-[clamp(1.8rem,4vw,2.5rem)]")}>{title}</h1>
        {blurb ? <p className="mt-3 text-sm text-ink-soft">{blurb}</p> : null}
      </header>
      <div className="mt-8 rounded-md bg-sheet p-6">{children}</div>
      {footer ? (
        <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>
      ) : null}
    </div>
  );
}

export const authLinkClass =
  "text-pen underline underline-offset-2 hover:text-pen-deep";
