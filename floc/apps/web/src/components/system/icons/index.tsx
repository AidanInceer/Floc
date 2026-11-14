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

export function BellIcon({ muted = false, ...props }: IconProps & { muted?: boolean }) {
  return (
    <LineIcon {...props}>
      <path d="M3.6 9.8V6.6a3.4 3.4 0 0 1 6.8 0v3.2l1 1.2H2.6zM5.8 11.8a1.3 1.3 0 0 0 2.4 0" />
      {muted ? <path d="M2 2l10 10" /> : null}
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

export function ClockIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="7" cy="7" r="5.2" />
      <path d="M7 4v3.2l2 1.2" />
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

/** Goes somewhere: a row that opens another page, as against a chevron that opens or closes in place. */
export function ArrowRightIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M2.4 7h9.2M8 3.4 11.6 7 8 10.6" />
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

/** Share: three nodes on two lines, the same drawing as the phone's `ShareGlyph`. */
export function ShareIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="10.5" cy="2.9" r="1.75" />
      <circle cx="3.5" cy="7" r="1.75" />
      <circle cx="10.5" cy="11.1" r="1.75" />
      <path d="M5 7.9l4 2.3M9 3.8L5 6.1" />
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
      <path d="M5.67 3.12L6.06 1.68L7.94 1.68L8.33 3.12L9.69 3.91L11.14 3.53L12.07 5.15L11.02 6.22L11.02 7.78L12.07 8.85L11.14 10.47L9.69 10.09L8.33 10.88L7.94 12.32L6.06 12.32L5.67 10.88L4.31 10.09L2.86 10.47L1.93 8.85L2.98 7.78L2.98 6.22L1.93 5.15L2.86 3.53L4.31 3.91Z" />
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
