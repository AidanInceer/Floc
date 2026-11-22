import { peopleCount } from "../../../people/group-ticks";

export type GroupIdeasCount = { people: number; withStyle: number; you: boolean };

export function groupIdeasNote({ people, withStyle, you }: GroupIdeasCount): string | null {
  const without = people - withStyle;
  if (without <= 0) return null;
  const based = `Based on ${you ? "you and " : ""}${withStyle} of ${peopleCount(people)}.`;
  return `${based} ${without} ${without === 1 ? "has" : "have"} no travel style yet, so these may fit them less well.`;
}

export const groupIdeasTitle = (name: string): string => `Trips for ${name}`;
export const groupIdeasListName = (name: string): string => `Trip ideas for ${name}`;
