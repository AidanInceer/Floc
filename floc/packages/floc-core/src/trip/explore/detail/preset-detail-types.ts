export type PresetDayItem = { time: string; text: string; free?: true; highlight?: true };

export type PresetDay = {
  title: string;
  items: PresetDayItem[];
  highlight?: string;
};

export type PresetStopDetail = { place: string; summary: string; days: PresetDay[] };

export type PresetFigure = { value: string; label: string };

export const IDEA_PACES = ["Relaxed", "Steady", "Active"] as const;
export type IdeaPace = (typeof IDEA_PACES)[number];
export const IDEA_COSTS = ["Free", "Low", "Mid", "High"] as const;
export type IdeaCost = (typeof IDEA_COSTS)[number];

export type PresetIdea = { text: string; pace: IdeaPace; cost: IdeaCost };
export type PresetStopIdeas = { place: string; ideas: PresetIdea[] };
export type PresetSwap = { place: string; nights: number; instead: string; what: string };

export type PresetIdeas = { atStops: PresetStopIdeas[]; otherStops: PresetSwap[] };

export type PresetDetail = {
  stops: PresetStopDetail[];
  inPlan: PresetFigure[];
  ideas: PresetIdeas;
};
