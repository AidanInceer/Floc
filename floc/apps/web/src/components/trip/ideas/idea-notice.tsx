"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { busyMark, cx } from "@/components/system/ui";

const SHOWN_MS = 8000;

export type Notice = { text: string; href?: string; undo?: () => Promise<void> };

export function IdeaNotice({ notice, closed, onClear }: { notice: Notice; closed: boolean; onClear: () => void }) {
  const [busy, start] = useTransition();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    const timer = setTimeout(onClear, SHOWN_MS);
    return () => clearTimeout(timer);
  }, [failed, onClear]);

  const undo = () =>
    start(async () => {
      try {
        await notice.undo?.();
        onClear();
      } catch {
        setFailed(true);
      }
    });

  return (
    <p role="status" className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule bg-sheet-2 px-4 py-1.5 text-sm text-ink max-sm:px-3", closed && "rounded-b-md")}>
      <span className="min-w-0 flex-1 truncate">{failed ? "That did not undo. Try again." : notice.text}</span>
      {notice.href ? <Link href={notice.href} className="whitespace-nowrap text-pen-deep underline underline-offset-2">See it on Days</Link> : null}
      {notice.undo ? (
        <button type="button" disabled={busy} onClick={undo} className="whitespace-nowrap font-medium text-pen-deep underline underline-offset-2">
          Undo{busyMark(busy)}
        </button>
      ) : null}
    </p>
  );
}
