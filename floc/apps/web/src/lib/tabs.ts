type TabKey =
  | "overview"
  | "notes"
  | "dates"
  | "days"
  | "money"
  | "packing"
  | "files";

export type TabState = { key: TabKey; label: string };

export const TAB_LABELS: Record<string, string> = {
  notes: "Notes",
  route: "Route",
  dates: "Dates",
  days: "Days",
  money: "Money",
};

export const TRIP_TAB_CLUSTERS: readonly (readonly TabState[])[] = [
  [{ key: "overview", label: "Overview" }],
  [
    { key: "dates", label: "Dates" },
    { key: "days", label: "Days" },
  ],
  [
    { key: "money", label: "Money" },
    { key: "packing", label: "Packing" },
  ],
  [
    { key: "notes", label: "Notes" },
    { key: "files", label: "Files" },
  ],
];

export const TABS: TabState[] = TRIP_TAB_CLUSTERS.flat();
