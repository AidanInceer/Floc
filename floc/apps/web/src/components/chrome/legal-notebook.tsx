"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { DialogClose } from "@/components/system/dialog";
import { ButtonLink } from "@/components/system/ui";
import { LEGAL_LINKS, type LegalHref } from "./legal-links";

export function LegalNotebook({ href, onNavigate, onClose }: {
  href: LegalHref;
  onNavigate?: (href: LegalHref) => void;
  onClose?: () => void;
}) {
  const title = LEGAL_LINKS.find((link) => link.href === href)!.label;
  const navigate = (event: MouseEvent<HTMLAnchorElement>, next: LegalHref) => {
    if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(next);
  };

  return (
    <div className="legal-notebook">
      <div className="legal-notebook-top">
        <nav aria-label="Policies" className="flex min-w-0 items-center gap-1 sm:gap-2">
          {LEGAL_LINKS.slice(0,3).map((link) => (
            <Link key={link.href} href={link.href} onClick={(event) => navigate(event,link.href)}
              aria-current={href === link.href ? "page" : undefined}
              className="legal-notebook-tab">
              {link.href === "/privacy" ? "Privacy" : link.label}
            </Link>
          ))}
        </nav>
        {onClose ? <DialogClose onClick={onClose} /> : <ButtonLink href="/" variant="secondary" aria-label="Back to Floc">Back</ButtonLink>}
      </div>
      <div className="legal-notebook-spread">
        <aside className="legal-notebook-cover">
          <h1 className="font-display font-semibold leading-tight tracking-[-0.035em]">{title}</h1>
          <nav aria-label="Legal pages" className="legal-notebook-index">
            {LEGAL_LINKS.map((link,index) => (
              <Link key={link.href} href={link.href} onClick={(event) => navigate(event,link.href)}
                aria-current={href === link.href ? "page" : undefined}>
                <span className="font-mono text-[11px]">{String(index+1).padStart(2,"0")}</span>
                {link.label}
              </Link>
            ))}
          </nav>
          <svg className="mt-auto hidden size-9 text-ink-soft sm:block" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 3v9M1 2c3-1 4 0 6 1 2-1 3-2 6-1v9c-3-1-4 0-6 1-2-1-3-2-6-1Z" />
          </svg>
        </aside>
        <article className="legal-notebook-page" aria-label={`${title} content`} />
      </div>
    </div>
  );
}
