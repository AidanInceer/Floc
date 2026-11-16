import { PlusIcon } from "@/components/system/icons";
import { iconFrameClass } from "@/components/system/ui";

export function PackingIdeaRow({
  label,
  quantity,
  take,
}: {
  label: string;
  quantity: number;
  take: (label: string) => Promise<void>;
}) {
  return (
    <li className="flex min-h-11 items-center gap-2 !border-t !border-dashed !border-rule bg-sheet-2/60 px-3 py-1.5 sm:gap-3 sm:px-4">
      <form action={take.bind(null, label)}>
        <button
          type="submit"
          aria-label={`Add ${label} to my bag`}
          className={iconFrameClass("row")}
        >
          <PlusIcon />
        </button>
      </form>
      <span className="flex min-w-0 flex-1 items-baseline whitespace-pre text-sm text-ink-soft">
        <span className="font-mono text-xs tabular-nums text-ink-faint">{quantity}</span>
        <span className="text-ink-faint">{" — "}</span>
        <span className="truncate">{label}</span>
      </span>
    </li>
  );
}
