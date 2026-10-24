/**
 * The bar above a share link (#330, #442): who you are answering as, and the
 * account that keeps it. Kept for guests on purpose — it is the way to convert.
 */
import type { ReactNode } from "react";

export function GuestCta({ text, controls }: { text: string; controls: ReactNode }) {
  return (
    <div className="border-b border-rule bg-pastel-blue">
      <div className="mx-auto flex w-full max-w-[60rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <p className="min-w-0 text-sm text-pastel-blue-ink">{text}</p>
        <div className="sm:shrink-0">{controls}</div>
      </div>
    </div>
  );
}
