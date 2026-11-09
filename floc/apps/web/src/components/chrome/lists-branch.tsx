"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ListIcon } from "@/components/system/icons/account";
import { NavGlyph } from "@/components/system/icons/nav";
import { ReactionGlyph } from "@/components/system/icons/reaction";
import { cx } from "@/components/system/ui";

const PAGES = [
  { href: "/lists", label: "Saved", icon: <ReactionGlyph kind="heart" mine={false} /> },
  { href: "/lists/packing", label: "Packing", icon: <NavGlyph name="packing" /> },
];

/**
 * The Lists tab, open (#467): its glyph, then its two pages as segments in one hairline capsule, so Saved and Packing
 * read as Lists itself opening out rather than a second bar under it. The open page takes the tabs' own pen wash.
 */
export function ListsCapsule() {
  const path = usePathname();
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-sm border border-rule p-0.5">
      <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-sm text-ink sm:size-7">
        <ListIcon />
      </span>
      <nav aria-label="Lists pages" className="flex items-center gap-0.5">
        {PAGES.map((page) => {
          const here = path === page.href;
          return (
            <Link
              key={page.href}
              href={page.href}
              aria-current={here ? "page" : undefined}
              className={cx(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-sm font-medium transition-colors hover:bg-pen-soft sm:h-7",
                here ? "bg-pen-soft text-pen-deep" : "text-ink-faint hover:text-pen-deep",
              )}
            >
              <span className="inline-flex shrink-0">{page.icon}</span>
              {page.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
