import { PillNav } from "@/components/chrome/pill-nav";
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
    // The wrapper stretches so the tabs centre in the row; the track itself
    // stays content-width inside it and scrolls when the row runs out.
    <div className="flex min-w-0 flex-1 justify-center">
      <PillNav
        label="Trip sections"
        items={tabs.map((tab) => ({
          href: `/trip/${tripId}/${tab.key}`,
          label: tab.label,
          tourKey: tab.key,
        }))}
      />
    </div>
  );
}
