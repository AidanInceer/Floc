"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/system/ui";
import { CrossIcon } from "@/components/system/icons";
import { legalLinkFor, riseFrom } from "@/lib/legal/legal-sheet";

import { LegalBar } from "./legal-bar";
import "./legal-sheet.css";

const SLIDE_MS = 480;

// Why: the sheet starts exactly over the footer's row and returns there, so it reads as the footer rising.
function measure(sheet: HTMLElement) {
  const panel = sheet.querySelector<HTMLElement>(".legal-sheet-panel")!;
  const barTop = document.querySelector(".site-footer .legal-bar")?.getBoundingClientRect().top ?? null;
  const sheetTop = parseFloat(getComputedStyle(panel).top);
  sheet.style.setProperty("--rise", `${riseFrom({ barTop, sheetTop, viewport: innerHeight })}px`);
}

function lockScroll(sheet: HTMLElement) {
  const gutter = innerWidth - document.documentElement.clientWidth;
  const root = document.documentElement.style;
  const body = document.body.style;
  const before = { overflow: root.overflow, padding: body.paddingRight };
  sheet.style.setProperty("--gutter", `${gutter}px`);
  root.overflow = "hidden";
  body.paddingRight = `${gutter}px`;
  return () => {
    root.overflow = before.overflow;
    body.paddingRight = before.padding;
  };
}

/** The legal pages over whatever page opened them. Closing slides back into the footer, then steps back in history. */
export function LegalSheet({ children }: { children: ReactNode }) {
  const router = useRouter();
  const link = legalLinkFor(usePathname());
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const sheet = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockScroll(sheet);
    measure(sheet);
    sheet.showModal();
    sheet.querySelector<HTMLElement>(".legal-sheet-bar [aria-current]")?.focus({ preventScroll: true });
    // Why: a forced layout commits the start position, so setting the flag next runs the slide.
    sheet.getBoundingClientRect();
    sheet.dataset.open = "";
    return () => {
      delete sheet.dataset.open;
      sheet.close();
      unlock();
      opener?.focus({ preventScroll: true });
    };
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const sheet = ref.current!;
    measure(sheet);
    delete sheet.dataset.open;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => router.back(), reduced ? 0 : SLIDE_MS);
  }, [router]);

  if (!link) return null;
  return (
    <dialog ref={ref} className="legal-sheet" aria-labelledby="legal-title"
      onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="legal-sheet-dim" onClick={close} />
      <div className="legal-sheet-panel">
        <div className="legal-sheet-bar">
          <LegalBar current={link.href} replace end={
            <Button variant="secondary" onClick={close}><CrossIcon size={12} />Close</Button>
          } />
        </div>
        <div className="legal-sheet-body">{children}</div>
      </div>
    </dialog>
  );
}
