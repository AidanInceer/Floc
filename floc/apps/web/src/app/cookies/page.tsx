import { LegalPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/cookies",
  title: "Cookies",
  description: "The cookies and storage Floc uses, and what each one is for.",
});

export default function CookiesPage() {
  return <LegalPage href="/cookies" />;
}
