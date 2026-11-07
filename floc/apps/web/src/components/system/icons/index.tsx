/**
 * Why: cross, plus, minus and chevron share their paths with the phone's `glyphs.tsx`, so one mark
 * means one thing on both surfaces. A fold opens with this chevron, pointing down closed.
 */
import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";

export function LineIcon({
  children,
  size = 13,
  strokeWidth = 1.2,
  className,
}: {
  children: ReactNode;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

type IconProps = { size?: number; className?: string };

export function CrossIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M3.6 3.6 10.4 10.4M10.4 3.6 3.6 10.4" />
    </LineIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M7 3.2v7.6M3.2 7h7.6" />
    </LineIcon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M3.2 7h7.6" />
    </LineIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
    </LineIcon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M9.6 2.4l2 2-7 7-2.6.6.6-2.6z" />
    </LineIcon>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M7 11.2V3.2M3.6 6.6 7 3.2l3.4 3.4" />
    </LineIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M10.9 9.4A4.6 4.6 0 0 1 6 2a5 5 0 1 0 4.9 7.4Z" />
    </LineIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M7 9.4V2.6M4.4 5.2 7 2.6l2.6 2.6M2.4 9.4v1.4a1 1 0 0 0 1 1h7.2a1 1 0 0 0 1-1V9.4" />
    </LineIcon>
  );
}

/** Leaves Floc for another site. */
export function OutIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M5 2.5h6.5V9M11.5 2.5 2.5 11.5" />
    </LineIcon>
  );
}

export function CogIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="7" cy="7" r="1.9" />
      <path d="M6.1 1.6h1.8l.3 1.5 1.1.6 1.4-.5.9 1.6-1.1 1v1.4l1.1 1-.9 1.6-1.4-.5-1.1.6-.3 1.5H6.1l-.3-1.5-1.1-.6-1.4.5-.9-1.6 1.1-1V6.3l-1.1-1 .9-1.6 1.4.5 1.1-.6Z" />
    </LineIcon>
  );
}

const CHEVRON = {
  down: "M3.4 5.4 7 9l3.6-3.6",
  up: "M3.4 8.6 7 5l3.6 3.6",
  left: "M8.6 3.4 5 7l3.6 3.6",
  right: "M5.4 3.4 9 7l-3.6 3.6",
} as const;

/** A dashed ring round a dot: a place not chosen yet (an empty map's pill). */
export function TargetIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="7" cy="7" r="4.8" strokeDasharray="1.9 2.1" />
      <circle cx="7" cy="7" r="1.3" fill="currentColor" stroke="none" />
    </LineIcon>
  );
}

export function ChevronIcon({
  direction,
  ...props
}: IconProps & { direction: keyof typeof CHEVRON }) {
  return (
    <LineIcon {...props}>
      <path d={CHEVRON[direction]} />
    </LineIcon>
  );
}
