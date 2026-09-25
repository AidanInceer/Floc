/** Things that float over the page (#408): menus, bars and the thread, placed in viewport pixels. */
"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type Point = { left: number; top: number };

/** Redraws on scroll and resize, so a bar pinned to words stays on them. */
export function useViewportTick() {
  const [, tick] = useState(0);
  useEffect(() => {
    const again = () => tick((n) => n + 1);
    window.addEventListener("scroll", again, true);
    window.addEventListener("resize", again);
    return () => {
      window.removeEventListener("scroll", again, true);
      window.removeEventListener("resize", again);
    };
  }, []);
}

/** Closes on a press outside or Escape. `keep` lists elements whose presses do not count as outside. */
export function useDismiss(open: boolean, onClose: () => void, keep: () => (Element | null)[] = () => []) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (event: PointerEvent) => {
      const target = event.target as globalThis.Node;
      if (ref.current?.contains(target) || keep().some((el) => el?.contains(target))) return;
      onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("keydown", key);
    };
  }, [open, onClose, keep]);
  return ref;
}

/** Keeps a floating box on screen: flips above its anchor when there is no room below. */
export function useOnScreen(at: Point, anchorTop: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<CSSProperties>({ left: at.left, top: at.top, visibility: "hidden" });
  useLayoutEffect(() => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const left = Math.max(12, Math.min(window.innerWidth - box.width - 12, at.left));
    const below = at.top + box.height <= window.innerHeight - 12;
    const top = below ? at.top : Math.max(12, anchorTop - box.height - 8);
    setPlace({ left, top });
  }, [at.left, at.top, anchorTop]);
  return { ref, place };
}

export function Menu({ at, label, onClose, children, className = "" }: { at: Point; label: string; onClose: () => void; children: ReactNode; className?: string }) {
  const dismiss = useDismiss(true, onClose);
  const { ref, place } = useOnScreen(at, at.top - 4);
  return (
    <div
      ref={(el) => {
        dismiss.current = el;
        ref.current = el;
      }}
      className={`fe-menu ${className}`}
      role="menu"
      aria-label={label}
      style={place}
      onMouseDown={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}

export const TONES: [string, string][] = [["butter", "Yellow"], ["blush", "Rose"], ["mint", "Green"], ["peri", "Blue"]];

export function Swatches({ onPick, none = false, what }: { onPick: (tone: string | null) => void; none?: boolean; what: string }) {
  return (
    <span className="fe-swatches">
      {none ? <button type="button" className="fe-swatch" data-tone="none" title="None" aria-label={`No ${what}`} onClick={() => onPick(null)} /> : null}
      {TONES.map(([tone, name]) => (
        <button key={tone} type="button" className="fe-swatch" data-tone={tone} title={name} aria-label={`${name} ${what}`} onClick={() => onPick(tone)} />
      ))}
    </span>
  );
}
