import { LegalPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/contact",
  title: "Contact",
  description: "How to reach the people behind Floc.",
});

export default function ContactPage() {
  return <LegalPage href="/contact" />;
}
