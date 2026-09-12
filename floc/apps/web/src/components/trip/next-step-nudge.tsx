import type { NextStep } from "@floc/core/trip/next-step";
import { ButtonLink } from "@/components/system/ui";

export function NextStepNudge({ step, href }: { step: NextStep; href: string }) {
  return (
    <section data-tour="nudge" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-peri p-5 text-peri-ink">
      <p className="font-display text-lg">{step.said}</p>
      <ButtonLink href={href}>{step.action}</ButtonLink>
    </section>
  );
}
