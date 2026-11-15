import type { ReactNode } from "react";

import { legalLinkFor } from "@/lib/legal/legal-sheet";
import type { LegalHref } from "@/lib/legal/legal-links";

import { ContactDocument } from "./documents/contact";

const DOCUMENTS: Partial<Record<LegalHref, () => ReactNode>> = {
  "/contact": ContactDocument,
};

export function LegalDocument({ href }: { href: LegalHref }) {
  const { label } = legalLinkFor(href)!;
  const Document = DOCUMENTS[href];
  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-24 pt-9 sm:px-6">
      <h1 id="legal-title" className="font-display text-[clamp(2.2rem,4.4vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">{label}</h1>
      <section aria-label={`${label} content`} className="min-h-[40vh]">{Document ? <Document /> : null}</section>
    </div>
  );
}
