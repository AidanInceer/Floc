import { LegalPage } from "@/components/chrome/legal/legal-page";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/sitemap",
  title: "Sitemap",
  description: "Every page on Floc, in one list.",
});

export default function SitemapPage() {
  return <LegalPage href="/sitemap" />;
}
