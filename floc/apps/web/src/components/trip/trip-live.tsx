"use client";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { tripDocumentName } from "@floc/core/notes/live/live-names";
import { openTripSignal } from "@floc/core/notes/live/trip-signal";

import { useNotesSocket } from "@/components/notes/pages/use-live-notes";

/** Why a token at all: the provider will not send auth without one. The cookie is what the server checks. */
const TOKEN = "session";

/**
 * Reads the trip again when another member changes it (#577). The refresh also clears the client's
 * page cache, so a tab opened next shows the change too.
 */
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
