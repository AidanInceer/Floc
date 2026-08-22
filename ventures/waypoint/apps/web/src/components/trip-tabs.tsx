import { PillNav } from "@/components/pill-nav";
import { type TabState } from "@/lib/tabs";

// The trip's sections are the same pill group as the rest of the app's nav
// (ticket 191) — no folder-tab variant any more. Every tab is navigable from
// day one (ticket 126); no un-clickable stubs.
export function TripTabs({
  tripId,
  tabs,
}: {
  tripId: number;
  tabs: TabState[];
}) {
  return (
    <PillNav
      label="Trip sections"
      showPending
      className="mt-4"
      items={tabs.map((tab) => ({
        href: `/trip/${tripId}/${tab.key}`,
        label: tab.label,
      }))}
    />
  );
}
