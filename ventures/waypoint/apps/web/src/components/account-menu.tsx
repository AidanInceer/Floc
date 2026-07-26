"use client";

/**
 * The account pill in the header: avatar + first name, expanding to Profile,
 * Settings and Sign out. Settings used to be a loose link beside the avatar —
 * collapsing all three into one control is what keeps the right-hand side of
 * the bar readable now the nav sits there too.
 *
 * Not built on `Sheet`: that's a modal <dialog>, which is the wrong affordance
 * for a menu hanging off its own trigger. This is the only dropdown in v1, so
 * it stays a single narrow component rather than a general menu primitive.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Avatar, cx } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";

const itemClass =
  "block w-full rounded-sm px-2.5 py-1.5 text-left text-sm text-ink-soft hover:bg-sheet-2 hover:text-ink";

export function AccountMenu({
  user,
}: {
  user: { name: string; image: string | null };
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  // Navigating away must not leave the panel hanging over the new page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cx(
          "inline-flex items-center gap-2 rounded-full border border-rule-strong py-1 pl-1 pr-2.5 transition-colors",
          open ? "bg-sheet-2" : "bg-sheet hover:bg-sheet-2",
        )}
      >
        <Avatar name={user.name} src={user.image} size={26} />
        <span className="hidden text-sm text-ink-soft sm:inline">
          {firstName}
        </span>
        <span aria-hidden className="text-[10px] leading-none text-ink-faint">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-30 mt-1 w-48 rounded-md border border-rule-strong bg-sheet p-1 shadow-raised"
        >
          <Link
            ref={firstItemRef}
            role="menuitem"
            href="/profile"
            className={itemClass}
          >
            Profile
          </Link>
          <Link role="menuitem" href="/settings" className={itemClass}>
            Settings
          </Link>
          <div className="my-1 border-t border-dotted border-rule-strong" />
          <SignOutButton role="menuitem" className={itemClass} />
        </div>
      ) : null}
    </div>
  );
}
