"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { ChevronIcon } from "@/components/system/icons";
import { NavGlyph } from "@/components/system/icons/nav";
import { LinkIcon } from "@/components/system/icons/onboarding";
import { cx } from "@/components/system/ui";
import { LinkPaste } from "./link-paste";

const rowClass = "group flex w-full items-center gap-3 p-3.5 text-left transition-colors duration-220 ease-(--ease) hover:bg-pen-soft";
const tileClass = "grid size-[30px] shrink-0 place-items-center rounded-sm bg-sheet-3 text-ink-soft";

function RowText({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-sm text-ink">{label}</span>
      <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>
    </span>
  );
}

export function DoorRow({ icon, label, hint, onPress, open, tile = tileClass }: { icon: ReactNode; label: string; hint: string; onPress: () => void; open?: boolean; tile?: string }) {
  return (
    <button type="button" className={rowClass} onClick={onPress} aria-expanded={open}>
      <span className={tile}>{icon}</span>
      <RowText label={label} hint={hint} />
      <span className="text-ink-faint group-hover:text-pen-deep"><ChevronIcon direction={open ? "down" : "right"} /></span>
    </button>
  );
}

export function TripDoors() {
  const [pasting, setPasting] = useState(false);
  return (
    <section aria-label="Ways to start" className={cx("mx-auto mt-6 w-full max-w-[34rem] overflow-hidden rounded-md border border-rule bg-sheet", "divide-y divide-rule")}>
      <Link href="/explore" className={rowClass}>
        <span className={tileClass}><NavGlyph name="explore" /></span>
        <RowText label="Borrow one from Explore" hint="A ready-made route to make your own" />
        <span className="text-ink-faint group-hover:text-pen-deep"><ChevronIcon direction="right" /></span>
      </Link>
      <div>
        <DoorRow icon={<LinkIcon />} label="Got a link?" hint="Paste an invite and you are on the trip" onPress={() => setPasting(!pasting)} open={pasting} />
        {pasting ? <div className="px-3.5 pb-3.5 pl-[3.6rem]"><LinkPaste /></div> : null}
      </div>
    </section>
  );
}
