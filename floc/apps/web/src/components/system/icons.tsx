/**
 * Why: cross, plus, minus and chevron share their paths with the phone's `glyphs.tsx`, so one mark
 * means one thing on both surfaces. A fold opens with `FlockChevron`; this chevron points somewhere.
 */
import type { ReactNode } from "react";

import { cx } from "./ui";

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

const CHEVRON = {
  down: "M3.4 5.4 7 9l3.6-3.6",
  up: "M3.4 8.6 7 5l3.6 3.6",
  left: "M8.6 3.4 5 7l3.6 3.6",
  right: "M5.4 3.4 9 7l-3.6 3.6",
} as const;

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
