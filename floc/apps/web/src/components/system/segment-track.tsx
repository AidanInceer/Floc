"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { cx, segmentTrack, trackSegmentClass } from "./ui";

type Box = { left: number; top: number; width: number; height: number };

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const CHOSEN = '[aria-pressed="true"], [aria-selected="true"], [aria-current], label:has(:checked)';
const same = (a: Box | null, b: Box | null) =>
  a?.left === b?.left && a?.top === b?.top && a?.width === b?.width && a?.height === b?.height;

export function SegmentTrack({ as: Tag = "div", className, children, ...props }: ComponentProps<"div"> & { as?: "div" | "nav" }) {
  const track = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const pressed = useRef(false);

  const measure = useCallback(() => {
    const el = track.current?.querySelector<HTMLElement>(CHOSEN);
    const next = el ? { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight } : null;
    setBox((was) => (same(was, next) ? was : next));
  }, []);

  useIsoLayoutEffect(measure);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const resized = new ResizeObserver(measure);
    resized.observe(node);
    node.addEventListener("change", measure);
    return () => {
      resized.disconnect();
      node.removeEventListener("change", measure);
    };
  }, [measure]);

  return (
    <Tag
      ref={track}
      {...props}
      onMouseDown={(event) => {
        pressed.current = (event.target as HTMLElement).closest("label") !== null;
        if (pressed.current) event.preventDefault();
      }}
      onClick={(event) => {
        if (!pressed.current || !(event.target instanceof HTMLInputElement)) return;
        pressed.current = false;
        event.target.blur();
      }}
      data-thumb={box ? "" : undefined}
      className={cx(segmentTrack, "group/track relative", className)}
    >
      {box ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 rounded-sm bg-sheet shadow-card transition-[transform,width,height] duration-220 ease-(--ease) motion-reduce:transition-none"
          style={{ width: box.width, height: box.height, transform: `translate(${box.left}px, ${box.top}px)` }}
        />
      ) : null}
      {children}
    </Tag>
  );
}

export function PillToggle<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <SegmentTrack role="tablist" aria-label={label} className={cx("flex w-full items-center gap-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={cx(trackSegmentClass(opt.value === value), "flex-1 whitespace-nowrap px-4 py-1.5 text-sm")}
        >
          {opt.label}
        </button>
      ))}
    </SegmentTrack>
  );
}
