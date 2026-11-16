import type { ReactNode } from "react";

import { SectionHeading } from "@/components/system/ui";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 max-w-[46rem]">
      <SectionHeading>{title}</SectionHeading>
      <div className="legal-prose mt-3">{children}</div>
    </section>
  );
}

export function LegalTable({ head, rows, short = [] }: { head: string[]; rows: ReactNode[][]; short?: string[] }) {
  return (
    <table className="legal-table">
      <thead>
        <tr>{head.map((label) => <th key={label}>{label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((cells, row) => (
          <tr key={row}>
            {cells.map((cell, column) => (
              <td key={head[column]} data-label={head[column]} className={short.includes(head[column]) ? "legal-cell-short" : undefined}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
