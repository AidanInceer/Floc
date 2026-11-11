import { LegalPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/privacy",
  title: "Privacy policy",
  description: "What Floc holds about you, why, for how long, and who else sees it.",
});

export default function PrivacyPage() {
  return <LegalPage href="/privacy" />;
}
