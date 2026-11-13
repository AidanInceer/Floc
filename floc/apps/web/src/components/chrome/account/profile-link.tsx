"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, cx } from "@/components/system/ui";
import { BEAD } from "@/components/chrome/bead";

/** Your name in the top bar: a link to your profile, not a menu (#637). */
export function ProfileLink({ name }: { name: string }) {
  const here = usePathname() === "/profile";
  return (
    <Link
      href="/profile"
      aria-label="Your profile"
      aria-current={here ? "page" : undefined}
      className={cx(BEAD, "shrink-0 gap-2 pl-1.5 pr-3 text-ink-soft transition-colors hover:bg-pen-soft hover:text-pen-deep aria-[current=page]:text-ink")}
    >
      <span aria-hidden className="pointer-events-none inline-flex">
        <Avatar name={name} size={32} />
      </span>
      <span aria-hidden data-fuse="label" className="hidden text-sm sm:inline">
        {name.trim().split(/\s+/)[0] || name}
      </span>
    </Link>
  );
}
