import { ChevronIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

export function IdeasToggle({ open, count, controls, onToggle }: { open: boolean; count: number; controls: string; onToggle: () => void }) {
  return (
    <h2 className="justify-self-start">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={controls}
        onClick={onToggle}
        className="flex h-[31px] items-center gap-2 whitespace-nowrap rounded-sm pr-2 text-ink transition-colors hover:text-pen-deep"
      >
        <ChevronIcon direction="down" size={13} className={cx("shrink-0 text-ink-soft transition-transform duration-220 ease-(--ease) motion-reduce:transition-none", !open && "-rotate-90")} />
        <span className="font-display text-lg">Ideas</span>
        {open ? null : <span className="nums font-mono text-xs text-ink-soft">{count === 1 ? "1 idea" : `${count} ideas`}</span>}
      </button>
    </h2>
  );
}
