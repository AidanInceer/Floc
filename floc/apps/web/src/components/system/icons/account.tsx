import { LineIcon as Line } from "@/components/system/icons";

export function PersonIcon() {
  return (
    <Line size={15}>
      <circle cx="7" cy="4.9" r="2.3" />
      <path d="M2.8 12c.6-2.2 2.2-3.4 4.2-3.4s3.6 1.2 4.2 3.4" />
    </Line>
  );
}

/** Groups: three people, so it reads apart from Friends' two at glyph size (#637). */
export function GroupIcon() {
  return (
    <Line size={15}>
      <circle cx="7" cy="4.2" r="1.6" />
      <circle cx="2.9" cy="6.4" r="1.2" />
      <circle cx="11.1" cy="6.4" r="1.2" />
      <path d="M4.2 11.6c.4-2 1.4-3.1 2.8-3.1s2.4 1.1 2.8 3.1M1.2 11c.2-1.2.8-1.9 1.7-1.9M12.8 11c-.2-1.2-.8-1.9-1.7-1.9" />
    </Line>
  );
}

/** Bookings arrive as a forwarded confirmation email, so the mark is the envelope (#559, #637). */
export function EnvelopeIcon() {
  return (
    <Line size={15}>
      <rect x="1.6" y="3" width="10.8" height="8" rx="1.2" />
      <path d="M1.9 3.6 7 7.6l5.1-4" />
    </Line>
  );
}

/** Wish lists: a bookmark, filled while its page is open (#637). */
export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <Line size={15}>
      <path d="M3.6 1.9h6.8v10.2L7 9.7l-3.4 2.4Z" fill={filled ? "currentColor" : "none"} />
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


export function SunIcon() {
  return (
    <Line>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1.3v1.3M7 11.4v1.3M1.3 7h1.3M11.4 7h1.3M3 3l.9.9M10.1 10.1l.9.9M11 3l-.9.9M3.9 10.1 3 11" />
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
