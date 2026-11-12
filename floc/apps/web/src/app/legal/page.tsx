import { LegalPage as LegalFullPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/legal",
  title: "Legal",
  description: "Who runs Floc, and the legal notices for the site.",
});

export default function LegalPage() {
  return <LegalFullPage href="/legal" />;
}
