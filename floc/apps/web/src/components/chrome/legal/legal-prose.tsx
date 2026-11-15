import type { ReactNode } from "react";

import { SectionHeading } from "@/components/system/ui";

/** One titled part of a legal page. The prose inside takes its type from `.legal-prose`. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 max-w-[46rem]">
      <SectionHeading>{title}</SectionHeading>
      <div className="legal-prose mt-3">{children}</div>
    </section>
  );
}
