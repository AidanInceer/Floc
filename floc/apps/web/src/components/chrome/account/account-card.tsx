"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu } from "@/components/system/client-ui";
import { Avatar, cx } from "@/components/system/ui";
import { ArrowRightIcon } from "@/components/system/icons";
import { BEAD_ITEM, BEAD_PANEL } from "@/components/chrome/bead";
import { ThemeSwitch } from "@/components/settings/theme-switch";
import { SignOutButton } from "@/components/auth/sign-out-button";

// Why: the face is its own tile, so it takes the tile's states (hover, open, here) as a pen ring the width the glyph tiles show round a 13px glyph.
const faceClass = "pointer-events-none inline-flex rounded-sm transition-shadow";
const ringClass = "shadow-[0_0_0_2px_var(--pen-2)]";
const ringOnClass = "group-hover:shadow-[0_0_0_2px_var(--pen-2)] group-data-[open=true]:shadow-[0_0_0_2px_var(--pen-2)]";

const rowHover = "transition-colors hover:bg-pen-soft hover:text-pen-deep";

/** Your face in the top bar opens a small card: you (to Profile), the theme, and signing out — the theme two clicks from anywhere. */
export function AccountCard({ name, email }: { name: string; email: string }) {
  const here = usePathname() === "/profile";
  return (
    <Menu
      label={here ? "You, on your profile" : "You"}
      anchor="parent"
      triggerClassName={cx(BEAD_ITEM, "h-9 gap-2 sm:pr-3", here && "text-ink")}
      panelClassName={cx(BEAD_PANEL, "w-[17rem]")}
      trigger={
        <>
          <span aria-hidden className={cx(faceClass, here ? ringClass : ringOnClass)}>
            <Avatar name={name} size={26} />
          </span>
          <span aria-hidden data-fuse="label" className="hidden sm:inline">
            {name.trim().split(/\s+/)[0] || name}
          </span>
        </>
      }
    >
      <Link href="/profile" role="menuitem" className={cx("flex items-center gap-2.5 px-3.5 py-3", rowHover)}>
        <Avatar name={name} size={36} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-medium">{name}</span>
          <span className="truncate text-xs text-ink-faint">{email}</span>
        </span>
        <ArrowRightIcon className="text-ink-faint" />
      </Link>
      <div className="border-t border-rule px-3.5 py-2.5">
        <ThemeSwitch words className="w-full" />
      </div>
      <SignOutButton
        role="menuitem"
        className={cx("flex min-h-[38px] w-full items-center gap-2 border-t border-rule px-3.5 py-2 text-left text-[13px] text-ink-soft", rowHover)}
      />
    </Menu>
  );
}
