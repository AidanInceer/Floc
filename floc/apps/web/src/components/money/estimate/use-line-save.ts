"use client";

import { useState, useTransition } from "react";

import { saveLineForm } from "@/app/trip/[id]/money/estimate-actions";
import type { EstimateLine } from "@floc/core/money/estimate/lines";

export function useLineSave(tripId: number, line: EstimateLine) {
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);
  const save = (fields: Record<string, string>, onDone?: () => void) =>
    start(async () => {
      const form = new FormData();
      form.set("line", line);
      for (const [name, value] of Object.entries(fields)) form.set(name, value);
      const { error } = await saveLineForm(tripId, form);
      setProblem(error ?? null);
      if (!error) onDone?.();
    });
  return { save, pending, problem, clear: () => setProblem(null) };
}
