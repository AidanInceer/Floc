/**
 * Reads the trip again when another member changes it (#577), on the web's signal. Without the
 * socket the screen still re-reads on focus and on the query tick (`lib/api.ts`).
 */
import { HocuspocusProvider } from "@hocuspocus/provider";
import { tripDocumentName } from "@floc/core/notes/live/live-names";
import { openTripSignal } from "@floc/core/notes/live/trip-signal";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useNotesSocket } from "@/components/notes/use-live-notes";

const TOKEN = "session";

export function useTripLive(tripId: number, ready: boolean): void {
  const queryClient = useQueryClient();
  const socket = useNotesSocket();

  useEffect(() => {
    if (!socket || !ready) return;
    const session = openTripSignal({
      connect: () => {
        const provider = new HocuspocusProvider({ websocketProvider: socket, name: tripDocumentName(tripId), token: TOKEN });
        provider.attach();
        return provider;
      },
      onChange: () => void queryClient.invalidateQueries(),
    });
    return () => session.close();
  }, [socket, tripId, ready, queryClient]);
}
