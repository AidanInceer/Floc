import { LegalSheet } from "@/components/chrome/legal/legal-sheet";

// Why: one layout for all six sheets, so switching between them swaps the page and the sheet stays up.
export default function LegalSheetLayout({ children }: { children: React.ReactNode }) {
  return <LegalSheet>{children}</LegalSheet>;
}
