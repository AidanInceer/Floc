import { matchLabel } from "@floc/core/trip/explore/fit/match-words";

export function MatchDial({ percent }: { percent: number }) {
  const label = matchLabel(percent);
  return (
    <span role="img" aria-label={label} title={label} className="nums inline-flex h-4 shrink-0 items-center gap-[5px] whitespace-nowrap text-[11px] leading-none text-ink-soft">
      <svg viewBox="0 0 14 14" width={14} height={14} fill="none" stroke="currentColor" aria-hidden>
        <circle cx="7" cy="7" r="5" strokeWidth={1.2} className="stroke-rule-strong" />
        <circle cx="7" cy="7" r="5" strokeWidth={1.7} pathLength={100} strokeDasharray={`${percent} 100`} transform="rotate(-90 7 7)" />
      </svg>
      {percent}%
    </span>
  );
}
