/**
 * The one layout behind sign in, sign up and both halves of password reset
 * (ticket 200). Four screens that used to drift apart now share a shape, so
 * moving between them feels like staying in one place.
 */
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  blurb,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  blurb?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[27rem] px-4 pb-20 pt-12 sm:px-6">
      <header className="text-center">
        <p className="typed">{eyebrow}</p>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)]">{title}</h1>
        {blurb ? <p className="mt-3 text-sm text-ink-soft">{blurb}</p> : null}
      </header>
      <div className="mt-8 rounded-lg bg-sheet p-6">{children}</div>
      {footer ? (
        <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>
      ) : null}
    </div>
  );
}

/** The one link out of a screen, to its counterpart. */
export const authLinkClass =
  "text-pen underline underline-offset-2 hover:text-pen-deep";
