export const CABINS = ["economy", "premium", "business", "first"] as const;
export type Cabin = (typeof CABINS)[number];
export const STAY_STYLES = ["budget", "mid", "high"] as const;
export type StayStyle = (typeof STAY_STYLES)[number];
export const PACES = ["easy", "balanced", "active"] as const;
export type Pace = (typeof PACES)[number];

export const CABIN_LABELS: Record<Cabin, string> = { economy: "Economy", premium: "Economy+", business: "Business", first: "First" };
export const STAY_LABELS: Record<StayStyle, string> = { budget: "Budget", mid: "Mid-range", high: "High-end" };
export const PACE_LABELS: Record<Pace, string> = { easy: "Easy", balanced: "Balanced", active: "Active" };

export type TravelStyle = { cabin: Cabin; stay: StayStyle; pace: Pace };
export type StyleChoice = { cabin?: Cabin | null | undefined; stay?: StayStyle | null | undefined; pace?: Pace | null | undefined };

export const DEFAULT_STYLE: TravelStyle = { cabin: "economy", stay: "mid", pace: "balanced" };

const among = <T extends string>(list: readonly T[]) => (value: unknown): value is T => list.includes(value as T);
export const isCabin = among(CABINS);
export const isStayStyle = among(STAY_STYLES);
export const isPace = among(PACES);

export function resolveStyle(profile: StyleChoice, trip: StyleChoice): TravelStyle & { tripOnly: boolean } {
  return {
    cabin: trip.cabin ?? profile.cabin ?? DEFAULT_STYLE.cabin,
    stay: trip.stay ?? profile.stay ?? DEFAULT_STYLE.stay,
    pace: trip.pace ?? profile.pace ?? DEFAULT_STYLE.pace,
    tripOnly: Boolean(trip.cabin ?? trip.stay ?? trip.pace),
  };
}
