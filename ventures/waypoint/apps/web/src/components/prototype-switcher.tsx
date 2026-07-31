"use client";

/**
 * PROTOTYPE ONLY — throwaway (wayfinder ticket 82). A floating bar for
 * flipping between `?variant=` renderings of a page. Never ships: it returns
 * null in production builds, and the whole file leaves main once a direction
 * has won.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function PrototypeSwitcher({
  variants,
  current,
}: {
  /** e.g. [["A", "Journey spine"], ["B", "Boarding-pass strip"]] */
  variants: [key: string, name: string][];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const i = Math.max(
    0,
    variants.findIndex(([k]) => k === current),
  );

  const go = (delta: number) => {
    const next = variants[(i + delta + variants.length) % variants.length][0];
    const q = new URLSearchParams(params.toString());
    q.set("variant", next);
    router.replace(`${pathname}?${q.toString()}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1 rounded-full border-2 border-ink bg-ink px-2 py-1.5 text-sheet shadow-lg">
      <button
        onClick={() => go(-1)}
        aria-label="Previous variant"
        className="px-2 py-0.5 text-sm"
      >
        ←
      </button>
      <span className="px-2 font-mono text-[11px] uppercase tracking-[0.08em]">
        {variants[i][0]} — {variants[i][1]}
      </span>
      <button
        onClick={() => go(1)}
        aria-label="Next variant"
        className="px-2 py-0.5 text-sm"
      >
        →
      </button>
    </div>
  );
}
