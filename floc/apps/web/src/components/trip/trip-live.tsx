"use client";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { tripDocumentName } from "@floc/core/notes/live/live-names";
import { openTripSignal } from "@floc/core/notes/live/trip-signal";

import { useNotesSocket } from "@/components/notes/pages/use-live-notes";

const TOKEN = "session";

export function TripLive({ tripId }: { tripId: number }) {
  const router = useRouter();
  const socket = useNotesSocket();

  useEffect(() => {
    if (!socket) return;
    const session = openTripSignal({
      connect: () => {
        const provider = new HocuspocusProvider({ websocketProvider: socket, name: tripDocumentName(tripId), token: TOKEN });
        provider.attach();
        return provider;
      },
      onChange: () => router.refresh(),
    });
    return () => session.close();
  }, [socket, tripId, router]);

  return null;
}
