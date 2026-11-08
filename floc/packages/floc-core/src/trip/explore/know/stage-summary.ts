import type { KnowStage } from "./know-types";

export type StageSummary = { tips: number; temporary: number; peek: string };

const plain = (marked: string) => marked.replace(/\*\*/g, "");

/** What a closed stage card says about itself. */
export function stageSummary(stage: KnowStage): StageSummary {
  if (stage.stage === "At the stops") {
    const tips = stage.stops.flatMap((s) => s.tips);
    return { tips: tips.length, temporary: tips.filter((t) => t.temporary).length, peek: stage.stops.map((s) => s.place).join(" · ") };
  }
  return { tips: stage.tips.length, temporary: stage.tips.filter((t) => t.temporary).length, peek: stage.tips.map((t) => plain(t.title)).join(" · ") };
}

export function stageMeta({ tips, temporary }: StageSummary): string {
  return `${tips} ${tips === 1 ? "tip" : "tips"}${temporary ? ` · ${temporary} temporary` : ""}`;
}
