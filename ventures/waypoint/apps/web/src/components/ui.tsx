/**
 * The hand-rolled component inventory the page list needs (ticket 11).
 * No shadcn/ui: v1 needs ~12 primitives, and owning them keeps the visual
 * language (a shared paper travel journal — ruled sheets, a red margin,
 * ink stamps for anything decided) undiluted.
 *
 * Everything here is a server component unless it says "use client".
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { whoTone } from "@/lib/who";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The page itself is a sheet of ruled paper — in paper.html this is the one
 * `.sheet.ruled` per screen, tape and all. Individual `Card`s inside it are
 * plain note-cards, not more paper; the ruled lines and the red margin only
 * happen once, at this outer level, or the metaphor turns to noise.
 */
export function Page({
  children,
  wide,
  flush,
}: {
  children: ReactNode;
  wide?: boolean;
  /**
   * Drops the gap above the sheet so a tab strip rendered immediately before it
   * can sit *on* its top edge — the notebook-divider effect. Every
   * `trip/[id]/*` page passes this (with `wide`, so the sheet's edges line up
   * with the tabs); nothing else should.
   */
  flush?: boolean;
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-4 pb-16 sm:px-6",
        flush ? "pt-0" : "pt-6",
        // 4xl rather than 3xl for the standard sheet (ticket 95): Trips,
        // Friends, Profile and Settings are one set of pages and were visibly
        // narrower than everything reached from the same header, which read as
        // the sheet changing size when you moved between them. `wide` is still
        // the trip tabs and Explore, where the extra width is doing work.
        wide ? "max-w-6xl" : "max-w-4xl",
      )}
    >
      <div
        className={cx(
          "sheet-ruled sheet-margin relative overflow-hidden rounded-lg border border-rule bg-sheet shadow-raised",
          // Flush against the tabs above: the active tab covers this corner, so
          // rounding it would leave a notch between the two.
          flush && "rounded-t-none",
          "px-5 py-7 sm:px-8 sm:py-8",
          // The red margin sits at 22px on mobile, 46px from sm: up (see the
          // matching breakpoint in globals.css) — content must clear it.
          "pl-[38px] sm:pl-[76px]",
        )}
      >
        {/* No tape on a flush page: it hangs over the sheet's top edge, which
            is where the folder tabs now are. A sheet bound into the notebook
            doesn't need taping down anyway. */}
        {flush ? null : <span aria-hidden className="tape" />}
        {/* Content sits above the ruled lines and the margin, which are
            absolutely-positioned pseudo-elements and would otherwise paint
            over it — see the z-index note in globals.css. */}
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

/**
 * A note-card — one item pinned to the sheet. Flatter than the page itself:
 * a plain border, no ruled lines, no shadow. Paper's ruling only happens
 * once per screen (see `Page`); a card with its own lines too would read as
 * clutter rather than as more of the same journal.
 */
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
  /**
   * Sets the title in the page's own voice rather than the small typed label —
   * used where the heading names a real thing the reader is scanning for (a
   * stop's place, a day's date), which the 11px uppercase `.typed` was too
   * quiet to carry.
   */
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

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger";

// Biro, not a UI button: solid ink for the pen, an outline for everything
// else. `brightness` stands in for a hover-darken since there's no separate
// "deep" ink token — a real pen doesn't have a hover state either.
const variants: Record<Variant, string> = {
  primary: "border-pen bg-pen text-sheet hover:brightness-110",
  secondary: "border-rule-strong bg-sheet text-ink-2 hover:bg-sheet-2",
  ghost: "border-transparent bg-transparent text-pen hover:bg-pen-soft",
  danger: "border-red/30 bg-red-soft text-red hover:bg-red/15",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors disabled:pointer-events-none disabled:opacity-50";

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

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

/** The three-state semantics used identically across every tab. */
export type Tone = "agreed" | "open" | "action" | "neutral" | "marine";

// paper.html's `.mark` — a highlighter-and-correction-pen vocabulary, not a
// generic coloured pill. "open" is a highlighter wash (needs the darker
// highlight-ink text to stay legible on yellow), "action" is correction red.
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
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * An ink stamp — for a state the group has actually *decided*, not just a
 * status label. Used sparingly: a trip that's ended, a split that's settled.
 * Everything else stays a `Badge`. Rotated slightly, like it was stamped by
 * hand and not quite square.
 */
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

export function LockedNotice({ reason }: { reason: string }) {
  return (
    <Card className="px-6 py-10 text-center">
      <Stamp tone="open">Not open yet</Stamp>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{reason}</p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

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
  /** A `who-*` class. Pass a trip member's own `tone` so they keep one colour
      everywhere in that trip; omit it to fall back to the name hash. */
  tone?: string;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size / 2.6) };
  if (src) {
    return (
      // Avatars come from arbitrary provider hosts; next/image would need
      // every one allow-listed.
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
      {shown.map((p, i) => (
        <span key={`${p.name}-${i}`} className={i > 0 ? "-ml-2" : undefined}>
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

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

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
