import { LegalNotebook } from "./legal-notebook";
import type { LegalHref } from "./legal-links";

export function LegalPage({ href }: { href: LegalHref }) {
  return <div className="legal-notebook-route"><LegalNotebook href={href} /></div>;
}
