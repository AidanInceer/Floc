import { LegalPage } from "@/components/chrome/legal/legal-page";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <LegalPage href="/privacy" />;
}
