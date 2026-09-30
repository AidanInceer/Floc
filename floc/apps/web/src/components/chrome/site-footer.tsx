import { LegalBar } from "@/components/chrome/legal/legal-bar";

export function SiteFooter() {
  return (
    <footer className="site-footer mt-24 border-t border-rule">
      <LegalBar end={
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">United Kingdom</span>
      } />
    </footer>
  );
}
