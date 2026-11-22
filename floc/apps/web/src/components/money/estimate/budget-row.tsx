export const LINE_ROW = "grid grid-cols-[26px_minmax(160px,1fr)_minmax(140px,220px)_230px_26px] items-center gap-3.5 border-b border-rule py-3 pl-6 pr-4 text-[15px] max-sm:grid-cols-[26px_minmax(0,1fr)_26px] max-sm:gap-x-2.5 max-sm:gap-y-1.5 max-sm:pl-4 max-sm:pr-4";
export const BAR_CELL = "max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-2";
export const FIGURE_CELL = "grid justify-items-end gap-1 text-[13px] max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-3 max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:justify-between";

export function LineDetail({ text }: { text: string }) {
  return <small className="text-pretty text-[13px] text-ink-faint">{text.split(" · ").join(" · ")}</small>;
}
