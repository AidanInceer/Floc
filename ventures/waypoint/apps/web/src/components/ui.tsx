// Hand-rolled component inventory (ticket 11) — no shadcn/ui, keeps the
// paper-journal visual language undiluted. Server components unless "use client".
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { whoTone } from "@/lib/who";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// The page is a sheet of ruled paper (paper.html's `.sheet.ruled`) — ruling
// and the red margin happen once, at this outer level; Cards stay plain.
export function Page({
  children,
  wide,
  flush,
}: {
  children: ReactNode;
  wide?: boolean;
  /** Drops the gap above the sheet so a tab strip sits *on* its top edge. Only `trip/[id]/*` pages pass this. */
  flush?: boolean;
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-4 pb-16 sm:px-6",
        // Trip pages (flush) sit under the floating pill tabs (ticket 191);
        // a small gap, not the folder-tab attachment the old chrome needed.
        flush ? "pt-3" : "pt-6",
        // 84rem width (ticket 103) is shared with app-chrome.tsx and
        // trip/[id]/layout.tsx — change all three together or edges misalign.
        wide ? "max-w-[84rem]" : "max-w-4xl",
      )}
    >
      <div
        className={cx(
          "sheet-ruled sheet-margin relative overflow-hidden rounded-lg border border-rule bg-sheet shadow-raised",
          "px-5 py-7 sm:px-8 sm:py-8",
          // Must clear the red margin (22px mobile / 46px sm:, see globals.css).
          "pl-[38px] sm:pl-[76px]",
        )}
      >
        {/* No tape on flush: the folder tabs now cover that edge. */}
        {flush ? null : <span aria-hidden className="tape" />}
        {/* Above the ruled lines/margin pseudo-elements — see z-index note in globals.css. */}
        <div className="sheet-content">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

// Flatter than Page on purpose — ruling happens once per screen, not per card.
export function Card({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div" | "li";
}) {
  return (
    <As className={cx("rounded-md border border-rule bg-sheet-2", className)}>
      {children}
    </As>
  );
}

export function CardHeader({
  title,
  hint,
  actions,
  strong,
}: {
  title: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  /** Full-voice title instead of the quiet uppercase `.typed` label — for headings naming a real thing (a place, a date). */
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dotted border-rule-strong px-4 py-3">
      <div>
        <h2 className={strong ? "text-[15px] font-bold text-ink" : "typed"}>
          {title}
        </h2>
        {hint ? <p className="mt-0.5 text-xs text-ink-faint">{hint}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Stack({
  children,
  gap = 4,
  className,
}: {
  children: ReactNode;
  gap?: 2 | 3 | 4 | 6;
  className?: string;
}) {
  const gaps = { 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6" } as const;
  return (
    <div className={cx("flex flex-col", gaps[gap], className)}>{children}</div>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

// Hover must read without the cursor visible (ticket 120): primary steps to
// --pen-deep (brightness-110 was too subtle on dark ink); secondary jumps a
// full stock down, not a neighbouring one, so it reads as clickable at all.
const variants: Record<Variant, string> = {
  primary: "border-pen bg-pen text-sheet hover:border-pen-deep hover:bg-pen-deep",
  secondary:
    "border-rule-strong bg-sheet text-ink-2 hover:border-pen hover:bg-sheet-3 hover:text-ink",
  ghost: "border-transparent bg-transparent text-pen hover:bg-pen-soft hover:text-pen-deep",
  danger: "border-red/30 bg-red-soft text-red hover:border-red/60 hover:bg-red/15",
};

// Pill controls with the shared hover lift (ticket 190). `.lift` owns the
// transition, so no `transition-colors` here — the colour move rides it too.
const buttonBase =
  "lift inline-flex items-center justify-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none";

export function Button({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cx(buttonBase, variants[variant], className)}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link {...props} className={cx(buttonBase, variants[variant], className)} />
  );
}

/** The three-state semantics used identically across every tab. */
export type Tone = "agreed" | "open" | "action" | "neutral" | "marine";

// paper.html's `.mark` — highlighter/correction-pen vocabulary, not generic pills.
const tones: Record<Tone, string> = {
  agreed: "border-transparent bg-green-soft text-green",
  open: "border-transparent bg-highlight-soft text-highlight-ink",
  action: "border-transparent bg-red-soft text-red",
  neutral: "border-rule-strong text-ink-soft",
  marine: "border-transparent bg-pen-soft text-pen",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// For a state actually *decided* (trip ended, split settled) — everything
// else stays a Badge. Rotated slightly, like stamped by hand.
export function Stamp({
  tone = "done",
  children,
}: {
  tone?: "done" | "open";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-block -rotate-3 rounded-sm border-2 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] opacity-85",
        tone === "done" ? "border-green text-green" : "border-red text-red",
      )}
    >
      {children}
    </span>
  );
}

// Swatch + word — the visual-over-text convention from the availability
// calendar (ticket 76), lifted here for the travel map's key (ticket 122).
export function LegendKey({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-soft">
      <span className={cx("size-3 rounded-sm border", swatch)} aria-hidden />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-rule-strong px-6 py-10 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {children ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{children}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  size = 28,
  title,
  tone,
}: {
  name: string;
  src?: string | null;
  size?: number;
  title?: string;
  /** A `who-*` class — pass a member's own tone to keep it consistent trip-wide; omit to fall back to the name hash. */
  tone?: string;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size / 2.6) };
  if (src) {
    return (
      // Arbitrary provider hosts — next/image would need every one allow-listed.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        title={title ?? name}
        style={style}
        className="shrink-0 rounded-full border border-rule-strong object-cover"
      />
    );
  }
  return (
    <span
      style={style}
      title={title ?? name}
      aria-label={name}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-rule-strong font-mono font-semibold",
        tone ?? whoTone(name),
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarRow({
  people,
  max = 5,
  size = 28,
}: {
  people: { name: string; avatarUrl?: string | null; tone?: string }[];
  max?: number;
  size?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center">
      {/* inline-flex, not default inline — avoids a 1px leading offset (ticket 133). */}
      {shown.map((p, i) => (
        <span
          key={`${p.name}-${i}`}
          className={cx("inline-flex", i > 0 && "-ml-2")}
        >
          <Avatar name={p.name} src={p.avatarUrl} size={size} tone={p.tone} />
        </span>
      ))}
      {extra > 0 ? (
        <span className="-ml-2 inline-flex items-center justify-center rounded-full border border-rule-strong bg-sheet-2 px-1.5 font-mono text-xs font-semibold text-ink-soft"
          style={{ height: size, minWidth: size }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

const fieldBase =
  "w-full rounded-md border border-rule-strong bg-sheet px-2.5 py-1.5 font-mono text-sm text-ink placeholder:text-ink-faint";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="typed mb-1 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-faint">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(fieldBase, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea {...props} className={cx(fieldBase, "min-h-20", className)} />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(fieldBase, className)} />;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red">{children}</p>;
}

export function Rule() {
  return <hr className="border-dotted border-rule-strong" />;
}
