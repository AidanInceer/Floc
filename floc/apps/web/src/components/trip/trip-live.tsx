"use client";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { tripDocumentName } from "@floc/core/notes/live/live-names";
import { openTripSignal, tripRefresh, tripTabOf } from "@floc/core/notes/live/trip-signal";
import { useNotesSocket } from "@/components/notes/pages/use-live-notes";

const TOKEN = "session";

export function TripLive({ tripId, renderedAt }: { tripId: number; renderedAt: number }) {
  const router = useRouter();
  const socket = useNotesSocket();
  const tab = tripTabOf(usePathname());
  const [refresh] = useState(tripRefresh);
  const view = useRef({ tab, renderedAt });

  useEffect(() => {
    view.current = { tab, renderedAt };
  }, [tab, renderedAt]);

  useEffect(() => {
    if (refresh.arrived(tab)) router.refresh();
  }, [tab, refresh, router]);

  useEffect(() => {
    if (!socket) return;
    const session = openTripSignal({
      connect: () => {
        const provider = new HocuspocusProvider({ websocketProvider: socket, name: tripDocumentName(tripId), token: TOKEN });
        provider.attach();
        return provider;
      },
      onChange: (change) => {
        if (refresh.heard(change, view.current)) router.refresh();
      },
    });
    return () => session.close();
  }, [socket, tripId, refresh, router]);

  return null;
}
