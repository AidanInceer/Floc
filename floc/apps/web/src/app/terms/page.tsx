import { LegalPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/terms",
  title: "Terms of use",
  description: "The terms for using Floc to plan a trip with your group.",
});

export default function TermsPage() {
  return <LegalPage href="/terms" />;
}
