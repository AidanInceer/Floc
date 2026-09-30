import { LegalPage as LegalNotebookPage } from "@/components/chrome/legal-page";

export const metadata = { title: "Legal" };

export default function LegalPage() {
  return <LegalNotebookPage href="/legal" />;
}
