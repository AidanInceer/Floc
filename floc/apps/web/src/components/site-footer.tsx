/**
 * Site-wide legal footer. The links are deliberately inert — the pages do not
 * exist yet, and a dead `href` that scrolls or 404s is worse than plain text.
 * Swap each `<span>` for a `<Link>` as its page lands.
 */
import { FlocWordmark } from "@/components/wordmark";

const LEGAL = [
  "Privacy policy",
  "Cookies",
  "Terms of use",
  "Legal",
  "Contact",
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex w-full max-w-[84rem] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-7 sm:px-6">
        <FlocWordmark />
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {LEGAL.map((item) => (
            <span
              key={item}
              className="cursor-default font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft"
            >
              {item}
            </span>
          ))}
        </nav>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft opacity-70">
          United Kingdom
        </span>
      </div>
    </footer>
  );
}
