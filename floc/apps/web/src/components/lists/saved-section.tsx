import type { ReactNode } from "react";

/** One run of Saved tiles under its name and count: your Saved tab and a friend's profile share it (#467, #544). */
export function SavedSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section aria-label={title} className="mt-8 first:mt-0">
      <h2 className="mb-3 flex items-baseline gap-2.5 font-display text-lg font-semibold tracking-[-0.015em]">
        {title}
        <span className="nums text-xs font-normal text-ink-faint">{count}</span>
      </h2>
      {children}
    </section>
  );
}

export const savedTripGridClass = "grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3";
export const savedCountryGridClass = "grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4";
