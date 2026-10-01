import { CrossIcon } from "@/components/system/icons";
import { ButtonLink } from "@/components/system/ui";
import type { LegalHref } from "@/lib/legal/legal-links";

import { LegalBar } from "./legal-bar";
import { LegalDocument } from "./legal-document";
import "./legal-sheet.css";

/** A legal page reached by its URL: the sheet at rest, not sliding over anything. */
export function LegalPage({ href }: { href: LegalHref }) {
  return (
    <div className="legal-page">
      <div className="legal-sheet-bar">
        <LegalBar current={href} end={
          <ButtonLink href="/" variant="secondary"><CrossIcon size={12} />Close</ButtonLink>
        } />
      </div>
      <LegalDocument href={href} />
    </div>
  );
}
