import Link from "next/link";

import { LegalFooterLinks } from "@/components/chrome/legal-footer-links";
import { FlocWordmark } from "@/components/system/wordmark";

export function SiteFooter() {
  return (
    <footer className="site-footer mt-24 border-t border-rule">
      <div className="mx-auto flex w-full max-w-[84rem] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-7 sm:px-6">
        <Link href="/" aria-label="Floc home">
          <FlocWordmark />
        </Link>
        <LegalFooterLinks />
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
          United Kingdom
        </span>
      </div>
    </footer>
  );
}
