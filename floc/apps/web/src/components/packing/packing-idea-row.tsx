import { PlusIcon } from "@/components/system/icons";

/**
 * One idea at the foot of a cube (#469, prototype A): a tinted row under a
 * dashed rule, so it never reads as packed or owned. The + takes it into the
 * bag; the host re-derives the count and the category from the catalogue, so
 * the form carries the label only.
 */
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
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-dashed border-pen-edge text-pen transition-colors hover:border-solid hover:border-pen hover:bg-pen hover:text-sheet sm:size-7"
        >
          <PlusIcon size={11} />
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
