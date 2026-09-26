import type { ReactNode } from "react";

function Line({ children, size = 13 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export function PersonIcon() {
  return (
    <Line size={15}>
      <circle cx="7" cy="4.9" r="2.3" />
      <path d="M2.8 12c.6-2.2 2.2-3.4 4.2-3.4s3.6 1.2 4.2 3.4" />
    </Line>
  );
}

export function SlidersIcon() {
  return (
    <Line size={15}>
      <path d="M2 4.2h5.9M10.5 4.2H12M2 9.8h1.5M6 9.8h6" />
      <circle cx="9.2" cy="4.2" r="1.3" />
      <circle cx="4.8" cy="9.8" r="1.3" />
    </Line>
  );
}

export function ListIcon() {
  return (
    <Line size={15}>
      <path d="M5.4 3.6H12M5.4 7H12M5.4 10.4H12M2.2 3.6h1.1M2.2 7h1.1M2.2 10.4h1.1" />
    </Line>
  );
}

export function SignOutIcon() {
  return (
    <Line>
      <path d="M6 2.2H3a.8.8 0 0 0-.8.8v8a.8.8 0 0 0 .8.8h3M9 4.5 11.5 7 9 9.5M11.5 7H5.5" />
    </Line>
  );
}

export function ChevronIcon() {
  return (
    <Line size={12}>
      <path d="M4.2 5.6 7 8.4l2.8-2.8" />
    </Line>
  );
}

export function SunIcon() {
  return (
    <Line>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1.3v1.3M7 11.4v1.3M1.3 7h1.3M11.4 7h1.3M3 3l.9.9M10.1 10.1l.9.9M11 3l-.9.9M3.9 10.1 3 11" />
    </Line>
  );
}

export function MoonIcon() {
  return (
    <Line>
      <path d="M10.9 9.4A4.6 4.6 0 0 1 6 2a5 5 0 1 0 4.9 7.4Z" />
    </Line>
  );
}

/** Auto follows the device, so it is drawn as one. */
export function DeviceIcon() {
  return (
    <Line>
      <path d="M2.3 3.2h9.4v6.2H2.3zM5 11.8h4M7 9.4v2.4" />
    </Line>
  );
}
