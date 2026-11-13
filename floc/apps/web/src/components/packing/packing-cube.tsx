import { cx } from "@/components/system/ui";
import { SparkIcon } from "@/components/system/icons/packing";
import { cubeCount, thingCount } from "@floc/core/packing/packing-words";

export function PackingCube({
  heading,
  total,
  packed,
  children,
  add,
  ideaCount = 0,
}: {
  heading: string;
  total: number;
  packed?: number;
  children: React.ReactNode;
  add?: React.ReactNode;
  ideaCount?: number;
}) {
  const count = packed === undefined ? { text: thingCount(total), full: false } : cubeCount(packed, total);
  const full = count.full;
  return (
    <section className={cx(
      "overflow-hidden rounded-md border bg-sheet",
      full ? "border-green-edge bg-green-soft" : "border-rule",
    )}>
      <header className="flex items-baseline justify-between gap-2 border-b border-dotted border-rule-strong px-4 py-3">
        <h3 className="text-sm font-semibold">{heading}</h3>
        {ideaCount > 0 ? (
          <span className="mr-auto inline-flex items-center gap-1 text-[11px] text-pen">
            <SparkIcon size={10} />
            {ideaCount} {ideaCount === 1 ? "idea" : "ideas"}
          </span>
        ) : null}
        {total > 0 ? (
          <span className={cx("nums text-[11px]", full ? "text-green" : "text-ink-faint")}>
            {count.text}
          </span>
        ) : null}
      </header>
      <ul className="divide-y divide-rule">{children}</ul>
      {add ? <div className="border-t border-rule px-3 py-2">{add}</div> : null}
    </section>
  );
}
