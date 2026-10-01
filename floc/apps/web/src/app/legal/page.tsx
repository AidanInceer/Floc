import { LegalPage as LegalFullPage } from "@/components/chrome/legal/legal-page";

export const metadata = { title: "Legal" };

export default function LegalPage() {
  return <LegalFullPage href="/legal" />;
}
