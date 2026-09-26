import type { ReactNode } from "react";

import { WhenScreen, WhereScreen } from "./screens-decide";
import { PackingScreen, TicketsScreen } from "./screens-kit";
import { MoneyScreen, PlanScreen } from "./screens-trip";

const SHOTS: Record<string, () => ReactNode> = {
  where: WhereScreen,
  when: WhenScreen,
  plan: PlanScreen,
  money: MoneyScreen,
  packing: PackingScreen,
  tickets: TicketsScreen,
};

/** Drawn on the server, so the carousel ships no screen markup in its bundle. */
export function shotFor(key: string): ReactNode {
  const Shot = SHOTS[key];
  return Shot ? <Shot /> : null;
}
