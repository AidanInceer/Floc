import { CheckIcon } from "@/components/system/icons";

export function NudgedMark() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-ink-faint">
      <CheckIcon size={11} />
      Nudged
    </span>
  );
}

export function NudgeNote({ note }: { note: string | null }) {
  return note ? (
    <span role="status" className="text-xs text-ink-faint">
      {note}
    </span>
  ) : null;
}
