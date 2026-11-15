import { budgetFit, lineProgress, totalRange, type BudgetFit, type LineProgress, type Range } from "./budget";
import type { FlightRoute, GuideLine, Missing } from "./guide/guide";
import type { EstimateLine, SpendLine } from "./lines";

export type OwnLine = { figure: number | null; budget: number | null };

export type PlanLine = {
  line: EstimateLine;
  guide: Range | null;
  own: number | null;
  plan: Range | null;
  budget: number | null;
  spent: number;
  progress: LineProgress;
  missing?: Missing;
  route?: FlightRoute;
};

export type Plan = {
  lines: PlanLine[];
  total: Range;
  other: number;
  spent: number;
  budget: number | null;
  left: number | null;
  fit: BudgetFit | null;
};

/** One member's estimate, all in their home currency: Floc's guide, their own figures over it, what they spent, their budget (#574). */
export function planFor(args: {
  guide: GuideLine[];
  own: Partial<Record<EstimateLine, OwnLine>>;
  spent: Record<SpendLine, number>;
  budget: number | null;
}): Plan {
  const lines = args.guide.map((g): PlanLine => {
    const own = args.own[g.line]?.figure ?? null;
    const plan: Range | null = own != null ? [own, own] : g.range;
    const spent = args.spent[g.line];
    return {
      line: g.line,
      guide: g.range,
      own,
      plan,
      budget: args.own[g.line]?.budget ?? null,
      spent,
      progress: lineProgress(spent, plan),
      ...(g.missing && { missing: g.missing }),
      ...(g.route && { route: g.route }),
    };
  });
  const total = totalRange(lines.map((l) => l.plan));
  const spent = Object.values(args.spent).reduce((a, b) => a + b, 0);
  return {
    lines,
    total,
    other: args.spent.other,
    spent,
    budget: args.budget,
    left: args.budget == null ? null : args.budget - spent,
    fit: budgetFit(args.budget, total),
  };
}
