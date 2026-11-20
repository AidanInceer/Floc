import Link from "next/link";

import { SectionHeading } from "@/components/system/ui";
import { sitemapSections } from "@/lib/seo/public-pages";

export function SitemapDocument() {
  return (
    <>
      {sitemapSections().map((section) => (
        <section key={section.title} className="mt-10">
          <SectionHeading>{section.title}</SectionHeading>
          <ul className="mt-3 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {section.links.map((link) => (
              <li key={link.path} className="border-b border-rule">
                <Link href={link.path} className="block py-2 text-ink transition-colors hover:text-pen">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
