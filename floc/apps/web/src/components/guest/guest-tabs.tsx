"use client";

/**
 * The two tabs somebody on a share link has (#330) — the trip, and the files
 * they cannot open.
 *
 * Files is a real tab rather than a hidden one: a trip with a folder in it is
 * part of what is being shown, and hiding the tab would misrepresent the trip
 * rather than protect it. What it holds is locked, which the page itself says.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/system/ui";

export function GuestTabs({ token }: { token: string }) {
  const here = usePathname();
  const base = `/invite/${token}`;

  const tabs = [
    { href: base, label: "The trip" },
    { href: `${base}/files`, label: "Files" },
  ];

  return (
    <nav aria-label="This trip" className="border-b border-rule bg-sheet">
      <div className="mx-auto flex w-full max-w-[84rem] gap-1 px-4 sm:px-6">
        {tabs.map((t) => {
          const on = here === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={cx(
                "-mb-px border-b-2 px-3 py-3 text-sm",
                on
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
