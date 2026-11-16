"use server";

import type { SignupChannel } from "@/db/schema";
import { getSession } from "@/server/access";
import { ensureProfile } from "@/server/auth/profile";
import { SIGNUP_CHANNELS } from "@floc/core/vocabulary";


export async function captureChannel(via: string): Promise<void> {
  const session = await getSession();
  if (!session?.user) return;

  const channel = (SIGNUP_CHANNELS as readonly string[]).includes(via)
    ? (via as SignupChannel)
    : "direct";

  await ensureProfile(session.user.id, { signupChannel: channel });
}
