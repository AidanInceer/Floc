"use client";

import { useState } from "react";

import { StartTripModal } from "@/components/onboarding/start/start-trip-modal";
import { PlusIcon } from "@/components/system/icons";
import { Button } from "@/components/system/ui";

export function PlanNext({ me, others }: { me: string; others: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" className="w-full whitespace-nowrap" onClick={() => setOpen(true)}>
        <PlusIcon size={12} />
        Plan the next one
      </Button>
      {open ? <StartTripModal open onClose={() => setOpen(false)} me={me} people={others} seed={{ along: others.map((p) => p.id) }} /> : null}
    </>
  );
}
