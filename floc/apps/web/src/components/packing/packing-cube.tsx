import { cx } from "@/components/system/ui";
import { SparkIcon } from "@/components/system/icons/packing";
import { cubeCount, thingCount } from "@floc/core/packing/packing-words";
import { nounFor } from "@floc/core/text/count-word";

export function PackingCube({
  heading,
  total,
  packed,
  children,
  add,
  ideaCount = 0,
  suggested = null,
}: {
  heading: string;
  total: number;
  packed?: number;
  children: React.ReactNode;
  add?: React.ReactNode;
  ideaCount?: number;
  suggested?: string | null;
}) {
  const count = packed === undefined ? { text: thingCount(total), full: false } : cubeCount(packed, total);
  const full = count.full;
  return (
    <section className={cx(
      "overflow-hidden rounded-md border bg-sheet",
      full ? "border-green-edge bg-green-soft" : "border-rule",
    )}>
      <header className="flex items-baseline gap-2 border-b border-dotted border-rule-strong px-4 py-3">
        <h3 className="text-sm font-semibold">{heading}</h3>
        {suggested ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-pen/60">
            <SparkIcon size={10} />
            {suggested}
          </span>
        ) : null}
        {ideaCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-pen">
            <SparkIcon size={10} />
            {ideaCount} {nounFor(ideaCount, "suggestion")}
          </span>
        ) : null}
        {total > 0 ? (
          <span className={cx("nums ml-auto text-[11px]", full ? "text-green" : "text-ink-faint")}>
            {count.text}
          </span>
        ) : null}
      </header>
      <ul className="divide-y divide-rule">{children}</ul>
      {add ? <div className="border-t border-rule px-3 py-2">{add}</div> : null}
    </section>
  );
}
