"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/system/ui";
import { CrossIcon } from "@/components/system/icons";
import { legalLinkFor, riseFrom } from "@/lib/legal/legal-sheet";

import { LegalBar } from "./legal-bar";
import "./legal-sheet.css";

const SLIDE_MS = 480;

function measure(sheet: HTMLElement) {
  const panel = sheet.querySelector<HTMLElement>(".legal-sheet-panel")!;
  const barTop = document.querySelector(".site-footer .legal-bar")?.getBoundingClientRect().top ?? null;
  const sheetTop = parseFloat(getComputedStyle(panel).top);
  sheet.style.setProperty("--rise", `${riseFrom({ barTop, sheetTop, viewport: innerHeight })}px`);
}

function lockScroll() {
  const root = document.documentElement.style;
  const before = root.overflow;
  root.overflow = "hidden";
  return () => { root.overflow = before; };
}

export function LegalSheet({ children }: { children: ReactNode }) {
  const router = useRouter();
  const link = legalLinkFor(usePathname());
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const sheet = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    measure(sheet);
    sheet.showModal();
    sheet.querySelector<HTMLElement>(".legal-sheet-bar [aria-current]")?.focus({ preventScroll: true });
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
