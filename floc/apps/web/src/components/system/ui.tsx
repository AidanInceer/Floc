/**
 * Hand-rolled component inventory (ticket 11) — no shadcn/ui, keeps the
 * white-and-pastel visual language undiluted. Server components unless "use client".
 *
 * Its twin is `floc/apps/mobile/src/components/ui.tsx`. The two are separate
 * files on purpose — this one draws DOM, that one draws native views — but
 * they are one product, so anything visible must stay aligned: a control added
 * or restyled here needs the same move there, or a reason it does not apply on
 * a phone. `docs/design/visual-language.html` rules both.
 */
import Link from "next/link";
import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import { whoTone } from "@floc/core/people/who";

import { AvatarIconMark } from "./avatar-icon";
import type { TripColor } from "@floc/core/trip/trip-color";
import { initials } from "@floc/core/people/initials";

/**
 * The four domain pastels as a rotation, for the places where a pastel is
 * DECORATION rather than meaning — a trip card, an Explore listing, a bed on
 * the day track. Three pages each kept their own copy of these four strings in
 * three different orders (ticket 207); one array means a colour cycle looks the
 * same wherever it appears. Where a pastel does carry meaning — money is mint,
 * dates are blue — write the pair out at the call site instead.
 */
// Keyed by the colour name so a *chosen* trip colour (ticket 213) maps to its
// skin, while the values in order are still the decorative rotation below.
export const PASTEL_BY_KEY = {
  peri: "bg-pastel-blue text-pastel-blue-ink",
  mint: "bg-pastel-green text-pastel-green-ink",
  butter: "bg-pastel-yellow text-pastel-yellow-ink",
  blush: "bg-pastel-red text-pastel-red-ink",
} as const satisfies Record<TripColor, string>;

export const PASTEL_SKINS = Object.values(PASTEL_BY_KEY);

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
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

type Variant = "primary" | "secondary" | "ghost" | "danger" | "pro";

// Hover must read without the cursor visible (ticket 120): primary steps to
// --pen-deep (brightness-110 was too subtle on dark ink); secondary jumps a
// full stock down, not a neighbouring one, so it reads as clickable at all.
const variants: Record<Variant, string> = {
  primary: "border-pen bg-pen text-sheet hover:border-pen-deep hover:bg-pen-deep",
  secondary:
    "border-rule-strong bg-sheet text-ink-2 hover:border-pen hover:bg-sheet-3 hover:text-ink",
  ghost: "border-transparent bg-transparent text-pen hover:bg-pen-soft hover:text-pen-deep",
  danger: "border-red/30 bg-red-soft text-red hover:border-red/60 hover:bg-red/15",
  // The only button outside the pastel palette — Pro's parchment and gold, so
  // the one paid action reads as paid wherever it lands.
  pro: "border-pro-edge bg-pro text-pro-gold hover:border-pro-gold hover:bg-pro-2",
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

/** A button that leaves Floc: new tab, no referrer, so the other site learns nothing about the trip. */
export function ExternalButtonLink({
  variant = "secondary",
  className,
  ...props
}: Omit<ComponentProps<"a">, "target" | "rel"> & { variant?: Variant }) {
  return (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(buttonBase, variants[variant], className)}
    />
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
  // The deep blue, not `--pen`: pen on the soft blue tint is 4.1:1, and a Badge
  // is 10.5px (ticket 204). pen-deep on the same tint is 8.5:1.
  marine: "border-transparent bg-pen-soft text-pen-deep",
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
  // An invitation, not a report (ticket 202): the action is the point of the
  // block, so it gets room rather than sitting as a footnote under the copy.
  return (
    <div className="rounded-lg bg-sheet-2 px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children ? (
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-ink-soft">{children}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Avatar({
  name,
  icon,
  size = 28,
  title,
  tone,
}: {
  name: string;
  /** Null is initials — the default, not a fallback (ticket 157). */
  icon?: AvatarIcon | null;
  size?: number;
  title?: string;
  /** A `who-*` class — pass a member's own tone to keep it consistent trip-wide; omit to fall back to the name hash. */
  tone?: string;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size / 2.6) };
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
      {icon ? (
        <AvatarIconMark icon={icon} size={Math.round(size * 0.56)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function AvatarRow({
  people,
  max = 5,
  size = 28,
}: {
  people: { name: string; avatarIcon?: AvatarIcon | null; tone?: string }[];
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
          <Avatar name={p.name} icon={p.avatarIcon} size={size} tone={p.tone} />
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
  const hintId = useId();
  const control =
    hint && isValidElement(children)
      ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
          "aria-describedby": hintId,
        })
      : children;
  return (
    <label className={cx("block", className)}>
      <span className="typed mb-1 block">{label}</span>
      {control}
      {hint ? (
        <span id={hintId} className="mt-1 block text-xs text-ink-faint">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/** For several controls under one name — a `<label>` would forward every click to the first. */
export function FieldGroup({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className={cx("block", className)}>
      <span id={labelId} className="typed mb-1 block">
        {label}
      </span>
      {children}
    </div>
  );
}

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cx("text-[clamp(1.9rem,4vw,2.8rem)]", className)}>{children}</h1>;
}

export function SectionHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx("text-xl", className)}>{children}</h2>;
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
  return (
    <p role="alert" className="text-sm text-red">
      {children}
    </p>
  );
}

/*
 * Row styling for `Menu` (ticket 125). Lives here, not beside `Menu` itself:
 * a Server Component importing a const from a `"use client"` module gets a
 * client reference rather than the string, and silently renders a stringified
 * function into `class`. `!` throughout to beat buttonBase — Tailwind v4
 * specificity is stylesheet order, not class-list order.
 */
export const menuItemClass =
  "!block !w-full !rounded-sm !border-none !px-2.5 !py-1.5 !text-left !font-sans !text-sm !normal-case !tracking-normal !text-ink-soft hover:!bg-sheet-2 hover:!text-ink";

/** The same row, for the one verb you can't take back. */
export const menuDangerItemClass =
  "!block !w-full !rounded-sm !border-none !bg-transparent !px-2.5 !py-1.5 !text-left !font-sans !text-sm !normal-case !tracking-normal !text-ink-soft hover:!bg-red-soft hover:!text-red";
