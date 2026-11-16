import { pressArea } from "@/components/system/ui";

export const squareButton =
  `${pressArea} !size-[26px] !shrink-0 !p-0 !transition-colors hover:!translate-y-0 hover:!shadow-none`;

export const tickBoxClass = (packed: boolean): string =>
  packed
    ? "border-green/40 bg-green-soft text-green"
    : "border-rule-strong bg-sheet text-ink-faint/60 hover:text-ink-soft";

export const tickBoxBase =
  `${pressArea} inline-flex size-[26px] shrink-0 items-center justify-center rounded-sm border transition-colors duration-[0.22s] ease-(--ease)`;

export function SelectLineBox({
  formId,
  lineId,
  label,
}: {
  formId: string | null;
  lineId: number;
  label: string;
}) {
  if (!formId) return null;
  return (
    <input
      type="checkbox"
      form={formId}
      name="lineId"
      value={lineId}
      aria-label={`Select ${label}`}
      className="size-4 shrink-0 accent-pen"
    />
  );
}
