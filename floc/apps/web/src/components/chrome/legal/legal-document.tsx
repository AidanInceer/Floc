import { legalLinkFor } from "@/lib/legal/legal-sheet";
import type { LegalHref } from "@/lib/legal/legal-links";

// Why: each page keeps its title and an empty body until Aidan has written the policy (ADR-022).
export function LegalDocument({ href }: { href: LegalHref }) {
  const { label } = legalLinkFor(href)!;
  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-24 pt-9 sm:px-6">
      <h1 id="legal-title" className="font-display text-[clamp(2.2rem,4.4vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">{label}</h1>
      <section aria-label={`${label} content`} className="min-h-[40vh]" />
    </div>
  );
}
