"use client";

import { useContext, useState, type ReactNode } from "react";
import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { StartTripModal } from "@/components/onboarding/start/start-trip-modal";
import { ListingWishContext } from "@/components/lists/wish/listing-wish";
import { Button } from "@/components/system/ui";

export function StartListing({ trip, className, defaultOpen, children }: { trip: PresetTrip; className?: string; defaultOpen?: boolean; children: ReactNode }) {
  const { me, people, along } = useContext(ListingWishContext);
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const listing = { id: trip.id, title: trip.title, nights: trip.nights, stops: stopsOf(trip).map((s) => s.place) };
  return (
    <>
      <Button type="button" variant="primary" className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      {open ? <StartTripModal open onClose={() => setOpen(false)} me={me} people={people} seed={{ along: along.map((p) => p.id) }} listing={listing} /> : null}
    </>
  );
}
