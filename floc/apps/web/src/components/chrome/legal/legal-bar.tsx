import Link from "next/link";
import type { ReactNode } from "react";

import { FlocWordmark } from "@/components/system/wordmark";
import { LEGAL_LINKS, type LegalHref } from "@/lib/legal/legal-links";

// Why: the footer and the risen sheet draw this one row, so each link keeps its place as the sheet slides up.
export function LegalBar({ current, end, replace = false }: { current?: LegalHref; end: ReactNode; replace?: boolean }) {
  return (
    <div className="legal-bar mx-auto flex w-full max-w-[84rem] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 sm:px-6">
      <Link href="/" aria-label="Floc home">
        <FlocWordmark />
      </Link>
      <nav aria-label="Legal" className="order-last flex basis-full flex-wrap items-center gap-x-5 gap-y-2 lg:order-none lg:basis-auto">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.href} href={link.href} replace={replace} scroll={false}
            aria-current={link.href === current ? "page" : undefined}
            className="border-b-[1.5px] border-transparent py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex h-9 items-center">{end}</div>
    </div>
  );
}
