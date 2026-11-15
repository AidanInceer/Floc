import { LegalPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/cookies",
  title: "Cookie policy",
  description: "How Floc uses cookies and similar technologies, and how to manage your preferences.",
});

export default function CookiesPage() {
  return <LegalPage href="/cookies" />;
}
