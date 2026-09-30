"use client";

import Link from "next/link";
import { useState } from "react";

import { Dialog } from "@/components/system/dialog";
import { LEGAL_LINKS, type LegalHref } from "./legal-links";
import { LegalNotebook } from "./legal-notebook";

export function LegalFooterLinks() {
  const [href,setHref] = useState<LegalHref | null>(null);
  const title = LEGAL_LINKS.find((link) => link.href === href)?.label ?? "Legal pages";
  return (
    <>
      <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.href} href={link.href} aria-haspopup="dialog"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              setHref(link.href);
            }}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink">
            {link.label}
          </Link>
        ))}
      </nav>
      <Dialog open={href !== null} onClose={() => setHref(null)} title={title} className="legal-notebook-dialog">
        <LegalNotebook href={href ?? "/privacy"} onNavigate={setHref} onClose={() => setHref(null)} />
      </Dialog>
    </>
  );
}
