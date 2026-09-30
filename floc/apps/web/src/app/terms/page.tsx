import { LegalPage } from "@/components/chrome/legal-page";

export const metadata = { title: "Terms of use" };

export default function TermsPage() {
  return <LegalPage href="/terms" />;
}
