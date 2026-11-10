import { CheckIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

/** A chip you press to pick: a button, so a rounded square, never a pill. The tick and `aria-pressed` say it is on. */
export function PickChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPress}
      className={cx(
        "inline-flex h-[30px] items-center gap-1.5 rounded-sm border px-3 text-[13px] transition-colors duration-220 ease-(--ease)",
        on ? "border-pen-edge bg-pen-soft text-pen-deep" : "border-rule-2 text-ink-soft hover:border-pen",
      )}
    >
      {on ? <CheckIcon size={12} /> : null}
      {label}
    </button>
  );
}

/** Words on the left in a fixed column, chips beside them; one column on a phone. */
export const pickLineClass = "grid items-center gap-x-3 gap-y-2 sm:grid-cols-[11rem_minmax(0,1fr)]";
