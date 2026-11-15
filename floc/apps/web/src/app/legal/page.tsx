import { LegalPage as LegalFullPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/legal",
  title: "Legal notice",
  description: "The provider of Floc, complaints, and third-party attributions.",
});

export default function LegalPage() {
  return <LegalFullPage href="/legal" />;
}
