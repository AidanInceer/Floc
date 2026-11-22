import { budgetFit, lineProgress, totalRange, type BudgetFit, type LineProgress, type Range } from "./budget";
import type { FlightRoute, GuideLine, Missing } from "./guide/guide";
import type { EstimateLine, SpendLine } from "./lines";
import type { TravelMode } from "./travel";

export type OwnLine = { figure: number | null; budget: number | null; notNeeded?: boolean };

export type PlanLine = {
  line: EstimateLine;
  needed: boolean;
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
  travel: TravelMode;
  awaiting: TravelMode | null;
};

export function isFlying(plan: Pick<Plan, "travel" | "lines">): boolean {
  return plan.travel === "flights" && plan.lines.find((l) => l.line === "flights")?.needed !== false;
}

export function planFor(args: {
  guide: GuideLine[];
  own: Partial<Record<EstimateLine, OwnLine>>;
  spent: Record<SpendLine, number>;
  budget: number | null;
  travel?: TravelMode;
}): Plan {
  const travel = args.travel ?? "flights";
  const lines = args.guide.map((g): PlanLine => {
    const held = args.own[g.line];
    const own = held?.figure ?? null;
    const needed = !held?.notNeeded;
    const priced: Range | null = own != null ? [own, own] : g.range;
    const plan = needed ? priced : null;
    const spent = args.spent[g.line];
    return {
      line: g.line,
      needed,
      guide: g.range,
      own,
      plan,
      budget: held?.budget ?? null,
      spent,
      progress: lineProgress(spent, plan),
      ...(g.missing && { missing: g.missing }),
      ...(g.route && { route: g.route }),
    };
  });
  const total = totalRange(lines.map((l) => l.plan));
  const spent = Object.values(args.spent).reduce((a, b) => a + b, 0);
  const getting = lines.find((l) => l.line === "flights");
  const awaiting = travel !== "flights" && getting?.needed && !getting.plan ? travel : null;
  return {
    lines,
    total,
    other: args.spent.other,
    spent,
    budget: args.budget,
    left: args.budget == null ? null : args.budget - spent,
    fit: awaiting ? null : budgetFit(args.budget, total),
    travel,
    awaiting,
  };
}
