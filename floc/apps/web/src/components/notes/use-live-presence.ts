"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";

import { presentPeople, type PresentPerson } from "@floc/core/notes/live/live-presence";

export function useLivePresence(provider: HocuspocusProvider): PresentPerson[] {
  const [people, setPeople] = useState<PresentPerson[]>([]);
  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;
    const update = () => setPeople(presentPeople(awareness.getStates()));
    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [provider]);
  return people;
}
