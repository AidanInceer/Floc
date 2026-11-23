import { sortIdeas, steadyOrder, type IdeaRow } from "@floc/core/trip/ideas";
import { useState } from "react";

export function useSteadyIdeas<T extends IdeaRow>(ideas: T[]): T[] {
  const ranked = sortIdeas(ideas, "votes").map((idea) => idea.id);
  const [seen, setSeen] = useState(ranked);
  const order = steadyOrder(seen, ranked);
  if (order.join() !== seen.join()) setSeen(order);
  const byId = new Map(ideas.map((idea) => [idea.id, idea]));
  return order.flatMap((id) => byId.get(id) ?? []);
}
