import { LegalSheet } from "@/components/chrome/legal/legal-sheet";

export default function LegalSheetLayout({ children }: { children: React.ReactNode }) {
  return <LegalSheet>{children}</LegalSheet>;
}
