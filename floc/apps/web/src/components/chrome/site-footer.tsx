import Link from "next/link";

import { LEGAL_LINKS } from "@/components/chrome/legal-links";
import { FlocWordmark } from "@/components/system/wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex w-full max-w-[84rem] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-7 sm:px-6">
        <Link href="/" aria-label="Floc home">
          <FlocWordmark />
        </Link>
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft opacity-70">
          United Kingdom
        </span>
      </div>
    </footer>
  );
}
