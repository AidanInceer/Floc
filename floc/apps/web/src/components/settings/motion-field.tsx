"use client";

import type { ChangeEvent } from "react";

import { updateMotion } from "@/app/profile/actions";
import { ToggleRow } from "@/components/auth/account-ui";
import { setStill } from "@/lib/motion/still";

import { AutoSaveForm } from "./auto-save-form";

const holdStill = (event: ChangeEvent<HTMLDivElement>) => {
  const box = event.target;
  if (box instanceof HTMLInputElement) setStill(document.documentElement, box.checked);
};

export function MotionField({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <AutoSaveForm action={updateMotion}>
      <div onChange={holdStill}>
        <ToggleRow
          name="reduceMotion"
          label="Turn animations off"
          hint="Maps and pages show where they end, without playing through."
          defaultChecked={reduceMotion}
        />
      </div>
    </AutoSaveForm>
  );
}
