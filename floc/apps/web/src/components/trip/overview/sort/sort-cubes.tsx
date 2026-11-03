import { cubeColumns } from "@floc/core/trip/overview/left-to-sort";
import { cx } from "@/components/system/ui";

export function SortCubes({ total, filled }: { total: number; filled: number }) {
  return (
    <span aria-hidden className="grid shrink-0 gap-[3px]" style={{ gridTemplateColumns: `repeat(${cubeColumns(total)}, 11px)` }}>
      {Array.from({ length: total }, (_, i) => (
        <i
          key={i}
          className={cx(
            "size-[11px] rounded-[3px] ring-1 ring-inset",
            i < filled ? "bg-pastel-blue-edge ring-pen-edge" : "bg-sheet-2 ring-rule-strong",
          )}
        />
      ))}
    </span>
  );
}
