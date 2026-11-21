import { cx } from "@/components/system/ui";

function StepDots({ of, at }: { of: number; at: number }) {
  return (
    <span className="flex items-center gap-1.5" role="img" aria-label={`Step ${at + 1} of ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <i
          key={i}
          className={cx("block h-1.5 rounded-full transition-[width,background-color] duration-220 ease-(--ease)", i === at ? "w-4 bg-pen" : "w-1.5", i < at ? "bg-pen" : i > at && "bg-rule-strong")}
        />
      ))}
    </span>
  );
}

export function StepFoot({ left, right, dots }: { left: React.ReactNode; right: React.ReactNode; dots?: { of: number; at: number } }) {
  return (
    <>
      <span className="flex flex-1">{left}</span>
      {dots ? <StepDots of={dots.of} at={dots.at} /> : null}
      <span className="flex flex-1 justify-end">{right}</span>
    </>
  );
}
