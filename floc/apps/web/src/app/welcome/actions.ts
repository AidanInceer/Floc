"use server";

import { readWelcomeAnswers } from "@floc/core/people/welcome/welcome";

import { requireUser } from "@/server/access";
import { finishWelcome } from "@/server/auth/welcome/welcome";

export async function finishWelcomeForm(formData: FormData): Promise<void> {
  const viewer = await requireUser("/trips");
  await finishWelcome(
    viewer.id,
    readWelcomeAnswers({
      airport: formData.get("airport"),
      currency: formData.get("currency"),
      cabin: formData.get("cabin"),
      stay: formData.get("stay"),
      pace: formData.get("pace"),
      vibes: formData.getAll("vibes"),
    }),
  );
}
