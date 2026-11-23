"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { MoreIcon } from "@/components/system/icons";
import { iconFrameClass, menuDangerItemClass, menuItemClass } from "@/components/system/ui";

const MENU_HEIGHT = 84;

export function IdeaMenu({ title, onEdit, onRemove }: { title: string; onEdit: () => void; onRemove: () => void }) {
  const [place, setPlace] = useState<CSSProperties | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const open = place !== null;

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector("button")?.focus({ preventScroll: true });
    const close = () => setPlace(null);
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") close();
      if (event.key !== "Escape") return;
      close();
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    if (open || !trigger.current) return setPlace(null);
    const box = trigger.current.getBoundingClientRect();
    const right = document.documentElement.clientWidth - box.right;
    const below = box.bottom + 4 + MENU_HEIGHT <= window.innerHeight;
    setPlace(below ? { right, top: box.bottom + 4 } : { right, bottom: window.innerHeight - box.top + 4 });
  };

  const choose = (run: () => void) => {
    setPlace(null);
    run();
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More for ${title}`}
        title="More"
        data-open={open}
        className={iconFrameClass("row")}
      >
        <MoreIcon />
      </button>
      {place ? (
        <div ref={panel} role="menu" aria-label={`More for ${title}`} style={{ position: "fixed", ...place }} className="z-[1200] w-36 rounded-md border border-rule-strong bg-sheet p-1 shadow-raised">
          <button type="button" role="menuitem" onClick={() => choose(onEdit)} className={menuItemClass}>Edit name</button>
          <button type="button" role="menuitem" onClick={() => choose(onRemove)} className={menuDangerItemClass}>Remove</button>
        </div>
      ) : null}
    </>
  );
}
