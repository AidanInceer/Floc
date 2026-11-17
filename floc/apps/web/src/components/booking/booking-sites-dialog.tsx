"use client";

import { MAX_SITES, siteChoices, type SiteKind } from "@floc/core/trip/booking/booking-sites";
import { useBookingSites } from "@/components/booking/booking-sites";
import { Sheet, useSheetClose } from "@/components/system/client-ui";
import { CheckIcon, SlidersIcon } from "@/components/system/icons";
import { Button, SheetFooter, cx, panelBandClass, panelTitleClass } from "@/components/system/ui";

const KIND_TITLE: Record<SiteKind, string> = { flights: "Flights", stays: "Stays" };

export function BookingSitesDialog() {
  return (
    <Sheet
      title="Booking sites"
      triggerVariant="secondary"
      body="flush"
      trigger={
        <>
          <SlidersIcon size={12} />
          Booking sites
        </>
      }
    >
      <KindChoices kind="flights" />
      <KindChoices kind="stays" />
      <SheetFooter>
        <DoneButton />
      </SheetFooter>
    </Sheet>
  );
}

function DoneButton() {
  const close = useSheetClose();
  return (
    <Button variant="primary" onClick={() => close?.()}>
      Done
    </Button>
  );
}

function KindChoices({ kind }: { kind: SiteKind }) {
  const { sites, toggle } = useBookingSites();
  const titleId = `booking-sites-${kind}`;
  return (
    <section aria-labelledby={titleId} className={cx(panelBandClass, "grid gap-0.5 first:border-t-0")}>
      <h3 id={titleId} className={cx(panelTitleClass, "flex items-baseline justify-between pb-1.5")}>
        {KIND_TITLE[kind]}
        <span className="flex items-baseline gap-2 text-xs font-normal text-ink-faint">
          {sites[kind].length >= MAX_SITES ? <span className="font-sans font-normal">Untick one to swap</span> : null}
          <span className="nums font-mono">
            {sites[kind].length} of {MAX_SITES}
          </span>
        </span>
      </h3>
      {siteChoices(sites, kind).map((line) => (
        <button
          key={line.site}
          type="button"
          role="checkbox"
          aria-checked={line.on}
          aria-label={line.why ? `${line.site} (${line.why.toLowerCase()})` : line.site}
          title={line.why ?? undefined}
          disabled={!line.can}
          onClick={() => toggle(kind, line.site)}
          className="group -mx-2 flex min-h-[38px] items-center gap-3 rounded-sm px-2 text-left text-sm transition-colors enabled:hover:bg-pen-soft disabled:cursor-default"
        >
          <span
            className={cx(
              "grid size-[22px] shrink-0 place-items-center rounded-sm border transition-colors",
              line.on ? "border-pen bg-pen text-sheet" : "border-rule-strong bg-sheet text-transparent group-enabled:group-hover:border-pen",
            )}
          >
            <CheckIcon size={12} />
          </span>
          <span className="text-ink">{line.site}</span>
          <span className="ml-auto pl-3 text-xs text-ink-faint">{line.use}</span>
        </button>
      ))}
    </section>
  );
}
