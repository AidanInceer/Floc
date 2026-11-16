import { CheckIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

export function PickChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPress}
      className={cx(
        "inline-grid h-[30px] place-items-center rounded-sm border px-3 text-[13px] transition-colors duration-220 ease-(--ease)",
        on ? "border-pen-edge bg-pen-soft text-pen-deep" : "border-rule-2 text-ink-soft hover:border-pen",
      )}
    >
      <span className="invisible col-start-1 row-start-1 inline-flex items-center gap-1.5" aria-hidden>
        <CheckIcon size={12} />
        {label}
      </span>
      <span className="col-start-1 row-start-1 inline-flex items-center gap-1.5">
        {on ? <CheckIcon size={12} /> : null}
        {label}
      </span>
    </button>
  );
}

export const pickLineClass = "grid items-center gap-x-3 gap-y-2 sm:grid-cols-[11rem_minmax(0,1fr)]";
