import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";

export function StepHead({ title, sub, tile, tone = "plain" }: { title: ReactNode; sub?: ReactNode; tile?: ReactNode; tone?: "plain" | "blue" | "yellow" }) {
  return (
    <div className="mb-4 grid justify-items-center gap-2 text-center">
      {tile ? (
        <span
          className={cx(
            "grid size-12 place-items-center rounded-md [&_svg]:size-5",
            tone === "blue" ? "bg-pastel-blue text-pastel-blue-ink" : tone === "yellow" ? "bg-pastel-yellow text-pastel-yellow-ink" : "bg-sheet-3 text-ink-soft",
          )}
        >
          {tile}
        </span>
      ) : null}
      <h2 className="text-lg">{title}</h2>
      {sub ? <p className="max-w-[32ch] text-balance text-sm text-ink-soft">{sub}</p> : null}
    </div>
  );
}
