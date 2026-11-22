import Image from "next/image";

import { LegalBar } from "@/components/chrome/legal/legal-bar";

export function SiteFooter() {
  return (
    <footer className="site-footer mt-24 border-t border-rule">
      <LegalBar end={
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          <Image src="/flags/gb.svg" alt="" width={16} height={8} unoptimized />
          <abbr title="United Kingdom" className="no-underline">UK</abbr>
        </span>
      } />
    </footer>
  );
}
